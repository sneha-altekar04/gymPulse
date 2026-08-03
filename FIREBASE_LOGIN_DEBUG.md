# Firebase Login Debugging Guide

## Quick Diagnosis

Run this in your browser console (F12) **after you've logged in with Firebase Auth**:

```javascript
import { advancedDiagnosis } from './src/utils/advancedDiagnostic.js';
await advancedDiagnosis();
```

This will show:
- ✅ If Firestore connection works
- ✅ If "users" collection exists
- ✅ All documents in "users" collection
- ❌ Any permission errors

## Common Issues & Solutions

### Issue 1: Firestore Rules Not Deployed

**Symptom**: Diagnostic shows "Cannot read 'users' collection" or permission error

**Solution**:
```bash
# Install Firebase CLI (if not done)
npm install -g firebase-tools

# Login to Firebase
firebase login

# List projects to find your project ID
firebase projects:list

# Select your project
firebase use gympulse-afcb1

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

**Manual way** (if Firebase CLI doesn't work):
1. Go to Firebase Console > **Firestore Database** > **Rules** tab
2. Copy entire content from `firestore.rules` file in your project
3. Paste into Firebase Console Rules editor
4. Click **Publish**

### Issue 2: User Document Format Error

**Symptom**: "User profile not found" but diagnostic shows document exists

**Check these fields are CORRECT**:
```
uid      → MUST match the UID exactly (copy-paste from Auth)
email    → MUST be exactly: owner@gympulse.com
name     → Any value (e.g., "Demo Owner")
role     → MUST be exactly: OWNER
gymId    → MUST be exactly: demo-gym-001
active   → MUST be boolean: true
```

**Common mistakes**:
- ❌ `role: "owner"` (lowercase - should be `OWNER`)
- ❌ `role: OWNER` (no quotes - should be string)
- ❌ `active: "true"` (string - should be boolean)
- ❌ `active: "false"` (string - should be boolean)

### Issue 3: Wrong Collection Location

**Check**: Is your document in `users` collection at ROOT level?

❌ **Wrong**: `gyms/demo-gym-001/users/...`  
✅ **Correct**: `users/{uid}`

### Issue 4: Document ID Mismatch

**CRITICAL**: The Document ID MUST be the exact UID from Firebase Auth

**How to verify**:
1. Go to Firebase Console > **Authentication** > Find `owner@gympulse.com`
2. Copy the UID (e.g., `jK7mL9pQ2rW3sT4uV5w...`)
3. Go to **Firestore Database** > `users` collection
4. Check Document ID matches exactly (case-sensitive!)

## Step-by-Step Fix

### Step 1: Verify Firestore Rules are Deployed
```bash
firebase deploy --only firestore:rules
```

### Step 2: Delete Old Document (If Exists)
1. Go to Firebase Console > Firestore Database
2. Open `users` collection
3. Find your document
4. Click **Delete document**

### Step 3: Create New Document Correctly

1. Click **Add document**
2. **Document ID**: Copy-paste the UID from Firebase Auth (the long string)
3. Click **Add field** and add:

| Field | Type | Value |
|-------|------|-------|
| uid | String | [paste UID exactly] |
| email | String | owner@gympulse.com |
| name | String | Demo Owner |
| role | String | OWNER |
| gymId | String | demo-gym-001 |
| active | Boolean | true |
| createdAt | Timestamp | (server timestamp) |
| updatedAt | Timestamp | (server timestamp) |

### Step 4: Verify in Firestore
- ✅ Document ID appears in green (means it exists)
- ✅ All 8 fields are present
- ✅ No warning icons
- ✅ All values match what's above

### Step 5: Test Login
1. Refresh browser
2. Try login: `owner@gympulse.com` / `Demo@123`
3. Should now work ✅

## If Still Not Working

Run diagnostic and **share the output**:

```javascript
import { advancedDiagnosis } from './src/utils/advancedDiagnostic.js';
await advancedDiagnosis();
```

The output will show exactly what's wrong.

---

**Most common fix**: Deploy Firestore rules with `firebase deploy --only firestore:rules`
