/**
 * Simple Console Diagnostic
 * Copy and paste this ENTIRE block into browser console (F12)
 * No imports needed!
 */

async function quickDiagnosis() {
  console.clear();
  console.log('🔍 QUICK FIREBASE DIAGNOSTIC\n');

  // Try to get Firebase modules from window (they should be loaded)
  const { getAuth } = window.firebase.auth;
  const { getFirestore, collection, getDocs, query, where, doc, getDoc } = window.firebase.firestore;

  const auth = getAuth();
  const db = getFirestore();

  // Check current user
  const user = auth.currentUser;

  if (!user) {
    console.log('❌ No user is logged in');
    console.log('Try logging in first, then run this again.\n');
    return;
  }

  console.log('✅ User authenticated:');
  console.log(`   Email: ${user.email}`);
  console.log(`   UID: ${user.uid}\n`);

  try {
    // Try to read users collection
    console.log('Checking Firestore access...\n');

    const usersRef = collection(db, 'users');
    const allDocs = await getDocs(usersRef);

    console.log(`✅ Can read "users" collection (${allDocs.size} documents)\n`);

    if (allDocs.size === 0) {
      console.log('❌ PROBLEM: "users" collection is EMPTY');
      console.log('   No user documents found!\n');
      return;
    }

    console.log('Documents in users collection:');
    allDocs.forEach((doc) => {
      console.log(`   - Document ID: ${doc.id}`);
    });
    console.log();

    // Query by uid field
    console.log(`Searching for document with uid: "${user.uid}"\n`);

    const userQuery = query(usersRef, where('uid', '==', user.uid));
    const queryResult = await getDocs(userQuery);

    if (queryResult.size === 0) {
      console.log('❌ PROBLEM: No document found with matching uid\n');

      // Check if document ID matches UID
      console.log('Checking if Document ID matches UID...\n');
      const docById = await getDoc(doc(db, 'users', user.uid));

      if (docById.exists()) {
        console.log('✅ Found document by Document ID!');
        const data = docById.data();
        console.log('   Fields:');
        console.log(`     - uid: ${data.uid}`);
        console.log(`     - email: ${data.email}`);
        console.log(`     - name: ${data.name}`);
        console.log(`     - role: ${data.role}`);
        console.log(`     - gymId: ${data.gymId}`);
        console.log(`     - active: ${data.active}`);
        console.log(`     - createdAt: ${data.createdAt}`);
        console.log(`     - updatedAt: ${data.updatedAt}\n`);

        console.log('✅ Document exists and looks correct!');
        console.log('The issue might be with Firestore rules.\n');
      } else {
        console.log('❌ Document NOT found by Document ID either\n');
        console.log('Document ID: ' + user.uid);
        console.log('Please create this document in Firebase Console\n');
      }
      return;
    }

    console.log('✅ Found user document!');
    const userData = queryResult.docs[0].data();
    console.log('   Fields:');
    console.log(`     - uid: ${userData.uid}`);
    console.log(`     - email: ${userData.email}`);
    console.log(`     - name: ${userData.name}`);
    console.log(`     - role: ${userData.role}`);
    console.log(`     - gymId: ${userData.gymId}`);
    console.log(`     - active: ${userData.active}\n`);

    console.log('✅ Everything looks CORRECT!');
    console.log('If login still fails, the issue is with the app code or browser cache.\n');
  } catch (error) {
    console.error('❌ Error accessing Firestore:', error.message);
    console.log('\nThis usually means:');
    console.log('  1. Firestore rules are not deployed');
    console.log('  2. User does not have permission to read');
    console.log('\nTry: firebase deploy --only firestore:rules\n');
  }
}

// Run it
quickDiagnosis();
