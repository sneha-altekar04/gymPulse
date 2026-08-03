# Firebase Manual Verification Checklist

Complete these checks manually in Firebase Console. This will tell us exactly what's wrong.

## Step 1: Verify Firebase Authentication

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: `gympulse-afcb1`
3. Go to **Authentication** tab
4. Find the user `owner@gympulse.com`
5. **COPY the UID** (it's a long string like: `jK7mL9pQ2rW3sT4uV5wX6yZ`)
6. Take a screenshot of the UID or note it down

## Step 2: Verify Firestore User Document

1. Go to **Firestore Database** tab
2. Look for the `users` collection
3. **Take a screenshot showing**:
   - The collection name: `users`
   - The document ID in the collection
   - All the fields inside the document

## Step 3: Compare UID and Document ID

1. Compare:
   - UID from Step 1 (from Authentication)
   - Document ID from Step 2 (from Firestore)
   
   ✅ They should be **EXACTLY the same** (character-by-character, case-sensitive)

## Step 4: Verify Field Values

Inside the Firestore document, check each field:

| Field | Should be | Correct? |
|-------|-----------|----------|
| `uid` | [same as Document ID] | ☐ |
| `email` | owner@gympulse.com | ☐ |
| `name` | Demo Owner (or any name) | ☐ |
| `role` | OWNER | ☐ |
| `gymId` | demo-gym-001 | ☐ |
| `active` | true (not "true") | ☐ |
| `createdAt` | Timestamp | ☐ |
| `updatedAt` | Timestamp | ☐ |

## Step 5: Check Firestore Rules

1. Go to **Firestore Database** > **Rules** tab
2. Check the first rule:
   ```
   match /users/{uid} {
     allow read, write: if request.auth.uid == uid;
   }
   ```
3. If you see this rule ✅
4. If you don't see any rules or it says "Start in test mode", that's the problem ❌

## What to Do If Rules Are Missing

Rules not deployed = login will fail

```bash
# Run this to deploy rules:
npm install -g firebase-tools
firebase login
firebase use gympulse-afcb1
firebase deploy --only firestore:rules
```

## Share With Me

After completing the checklist, tell me:
1. ✅ UID from Authentication (the long string)
2. ✅ Document ID in Firestore (should match UID)
3. ✅ All 8 fields are present and correct
4. ✅ Firestore rules are deployed

OR tell me which steps failed:
- ❌ Collection doesn't exist
- ❌ Document ID doesn't match UID
- ❌ Fields are missing
- ❌ Rules are not deployed
- ❌ Something else...

This will help me identify the exact problem! 🔍
