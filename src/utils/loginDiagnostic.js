/**
 * Firebase Login Diagnostic Tool
 * Use this to debug login issues
 * 
 * Run in browser console after logging in with Firebase Auth
 */

import { auth } from './src/firebase/firebase.js';
import { getDocument } from './src/firebase/firestore.js';

export async function diagnoseLoginIssue() {
  console.log('🔍 Diagnosing login issue...\n');

  // Step 1: Check if user is logged in
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }

  console.log('✅ User authenticated in Firebase Auth:');
  console.log(`   UID: ${user.uid}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Display Name: ${user.displayName || 'N/A'}\n`);

  // Step 2: Try to fetch user profile
  console.log('🔍 Searching for user profile in Firestore...');
  console.log(`   Collection: users`);
  console.log(`   Document ID: ${user.uid}\n`);

  try {
    const profile = await getDocument('users', user.uid);

    if (profile) {
      console.log('✅ User profile found!');
      console.log('   Fields:');
      console.log(`     - uid: ${profile.uid}`);
      console.log(`     - email: ${profile.email}`);
      console.log(`     - name: ${profile.name}`);
      console.log(`     - role: ${profile.role}`);
      console.log(`     - gymId: ${profile.gymId}`);
      console.log(`     - active: ${profile.active}`);
      console.log(`     - createdAt: ${profile.createdAt}`);
      console.log(`     - updatedAt: ${profile.updatedAt}\n`);
      console.log('✅ Everything looks good! Profile should load.');
    } else {
      console.error('❌ User profile NOT found in Firestore!');
      console.log('\n📋 SOLUTION: Create the user profile manually:\n');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Go to the "users" collection');
      console.log('3. Click "Add document"');
      console.log(`4. Document ID = "${user.uid}" (COPY THIS EXACTLY)`);
      console.log('5. Add these fields:');
      console.log(`   - uid: "${user.uid}"`);
      console.log(`   - email: "${user.email}"`);
      console.log('   - name: "Demo Owner"');
      console.log('   - role: "OWNER"');
      console.log('   - gymId: "demo-gym-001"');
      console.log('   - active: true');
      console.log('   - createdAt: (server timestamp)');
      console.log('   - updatedAt: (server timestamp)');
      console.log('6. Click Save');
      console.log('7. Refresh page and try login again\n');
    }
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    console.log('\n📋 POSSIBLE ISSUES:');
    console.log('1. Firestore rules don\'t allow reading "users" collection');
    console.log('2. Document ID doesn\'t match user UID exactly');
    console.log('3. Firestore database not initialized');
    console.log('4. Network connection issue\n');
  }
}

console.log('To run diagnosis, paste this in browser console:');
console.log('await diagnoseLoginIssue();');
