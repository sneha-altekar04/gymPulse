/**
 * Advanced Firebase Diagnostic Tool
 * This tool will identify exactly what's wrong with your setup
 * 
 * Usage in browser console (F12):
 * import { advancedDiagnosis } from './src/utils/advancedDiagnostic.js';
 * await advancedDiagnosis();
 */

import { auth, db } from '../firebase/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function advancedDiagnosis() {
  console.clear();
  console.log('🔍 ADVANCED FIREBASE DIAGNOSTIC\n');
  console.log('='.repeat(60));

  // ============================================
  // 1. CHECK AUTHENTICATION
  // ============================================
  console.log('\n📍 STEP 1: Firebase Authentication Status');
  console.log('-'.repeat(60));

  const user = auth.currentUser;

  if (!user) {
    console.log('❌ No user is currently authenticated');
    console.log('   Please log in first, then run this diagnostic again.');
    return;
  }

  console.log('✅ User authenticated in Firebase Auth');
  console.log(`   Email: ${user.email}`);
  console.log(`   UID: ${user.uid}`);
  console.log(`   Display Name: ${user.displayName || 'N/A'}`);
  console.log(`   Email Verified: ${user.emailVerified}`);

  // ============================================
  // 2. CHECK FIRESTORE CONNECTION
  // ============================================
  console.log('\n📍 STEP 2: Firestore Connection');
  console.log('-'.repeat(60));

  try {
    const testRef = collection(db, 'users');
    console.log('✅ Firestore connection successful');
    console.log(`   Database: ${db.app.options.projectId}`);
  } catch (err) {
    console.error('❌ Firestore connection failed:', err.message);
    return;
  }

  // ============================================
  // 3. CHECK IF USERS COLLECTION EXISTS
  // ============================================
  console.log('\n📍 STEP 3: Check "users" Collection');
  console.log('-'.repeat(60));

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`✅ "users" collection exists`);
    console.log(`   Total documents: ${snapshot.size}`);

    if (snapshot.size === 0) {
      console.log('   ⚠️  Collection is EMPTY - No user documents found');
    } else {
      console.log('   Documents in collection:');
      snapshot.forEach((doc) => {
        console.log(`     - Doc ID: ${doc.id}`);
      });
    }
  } catch (err) {
    console.error('❌ Cannot read "users" collection:', err.message);
    console.log('   This might be a Firestore rules issue');
  }

  // ============================================
  // 4. CHECK FOR USER DOCUMENT BY UID
  // ============================================
  console.log('\n📍 STEP 4: Search for User Document');
  console.log('-'.repeat(60));

  console.log(`   Looking for Document ID: "${user.uid}"`);

  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('uid', '==', user.uid));
    const snapshot = await getDocs(userQuery);

    if (snapshot.size > 0) {
      console.log('✅ User document found by UID query');
      const doc = snapshot.docs[0];
      console.log(`   Document ID: ${doc.id}`);
      console.log('   Fields:');
      console.log(`     - uid: ${doc.data().uid}`);
      console.log(`     - email: ${doc.data().email}`);
      console.log(`     - name: ${doc.data().name}`);
      console.log(`     - role: ${doc.data().role}`);
      console.log(`     - gymId: ${doc.data().gymId}`);
      console.log(`     - active: ${doc.data().active}`);
    } else {
      console.log('❌ User document NOT found');
      console.log('   No document with uid matching your authentication');
    }
  } catch (err) {
    console.error('❌ Error querying user document:', err.message);
  }

  // ============================================
  // 5. CHECK FIRESTORE RULES
  // ============================================
  console.log('\n📍 STEP 5: Firestore Rules Check');
  console.log('-'.repeat(60));

  console.log('ℹ️  Current Firestore Rules Status:');
  console.log('   Go to Firebase Console > Firestore Database > Rules tab');
  console.log('   to check if your rules allow reading the "users" collection.');
  console.log('\n   Your current rules should allow:');
  console.log('   - Reading: users/{uid} where uid == auth.uid');
  console.log('   - Reading: gyms/{gymId}/... where user.gymId matches');

  // ============================================
  // 6. CHECK COLLECTION DATA
  // ============================================
  console.log('\n📍 STEP 6: Collection Data Check');
  console.log('-'.repeat(60));

  try {
    // Check gyms collection
    const gymsRef = collection(db, 'gyms');
    const gymsSnapshot = await getDocs(gymsRef);
    console.log(`✅ Gyms collection: ${gymsSnapshot.size} documents`);
    gymsSnapshot.forEach((doc) => {
      console.log(`   - ${doc.id}: ${doc.data().name}`);
    });

    // Check users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    console.log(`✅ Users collection: ${usersSnapshot.size} documents`);
    usersSnapshot.forEach((doc) => {
      console.log(
        `   - ${doc.id}: ${doc.data().email} (role: ${doc.data().role})`
      );
    });
  } catch (err) {
    console.error('⚠️  Cannot read collections:', err.message);
  }

  // ============================================
  // 7. SUMMARY & RECOMMENDATIONS
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));

  console.log('\n✅ WHAT IS WORKING:');
  console.log('   - Firebase Authentication');
  console.log('   - Firestore connection');

  console.log('\n⚠️  POTENTIAL ISSUES TO CHECK:');
  console.log('   1. Is the document ID exactly the UID? (case-sensitive)');
  console.log('   2. Does the "uid" field match the UID?');
  console.log('   3. Do Firestore rules allow reading from "users"?');
  console.log('   4. Are all required fields present?');

  console.log('\n🔧 NEXT STEPS:');
  console.log('   1. Check Firebase Console > Firestore > Rules');
  console.log('   2. Verify document ID and uid field are identical');
  console.log('   3. Run this diagnostic again to see any changes');

  console.log('\n' + '='.repeat(60));
}

// Make function globally available
window.runDiagnosis = advancedDiagnosis;

console.log('📌 To run advanced diagnosis, paste this in console:');
console.log('await runDiagnosis();');
