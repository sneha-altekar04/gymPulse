# Firebase Setup Guide for GymPulse

This guide walks you through setting up Firebase for the GymPulse application.

## Prerequisites

- Firebase account (https://firebase.google.com)
- Google account
- Node.js 20+ (for production builds)
- GymPulse source code with Phase 3 implementation

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enter project name: `gympulse` (or your choice)
4. Accept terms and create
5. Wait for project setup to complete

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Enable **Email/Password** method:
   - Go to "Sign-in method" tab
   - Click **Email/Password**
   - Toggle enabled
   - Save

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Select region closest to your users (Asia/Kolkata for India)
4. **Important**: Start in **test mode** for development
   - In production, use security rules
5. Create database

## Step 4: Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Web** icon
4. Register web app
5. Copy the Firebase config object

Example config (looks like this):
```javascript
{
  apiKey: "AIzaSyDemoKeyForDevelopment",
  authDomain: "gympulse-demo.firebaseapp.com",
  projectId: "gympulse-demo",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

**Note**: GymPulse v1.0 uses Firebase Authentication and Firestore only. The `storageBucket` field is not needed.

## Step 5: Update Environment Variables

1. In project root, edit `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyDemoKeyForDevelopment
VITE_FIREBASE_AUTH_DOMAIN=gympulse-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gympulse-demo
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

VITE_USE_MOCK_DATA=false
```

2. **NEVER commit** `.env` to version control (already in .gitignore)

## Step 6: Deploy Firestore Security Rules

### Option A: Firebase CLI (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Select your project
firebase use gympulse-demo

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Option B: Manual Deployment

1. Go to **Firestore > Rules**
2. Copy content from `firestore.rules` in project
3. Paste into Firebase Console
4. Publish

## Step 7: Create Admin User Account

1. Go to Firebase Console > **Authentication > Users** tab
2. Click **Create user** button
3. Enter:
   - Email: `owner@gympulse.com`
   - Password: `Demo@123`
4. Click **Create user**
5. **Copy the UID** (you'll need it in Step 8)

## Step 8: Create User Profile in Firestore

**⚠️ IMPORTANT**: You MUST create a user document in Firestore for login to work. Without this, you'll get "User profile not found" error.

1. Go to **Firestore Database**
2. Click **Create collection** and name it `users`
3. Click **Add document**
4. Set the **Document ID** = the UID you copied from Step 7
5. Add these exact fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | (paste the UID from Step 7) |
| `email` | string | `owner@gympulse.com` |
| `name` | string | `Demo Owner` |
| `role` | string | `OWNER` |
| `gymId` | string | `demo-gym-001` |
| `active` | boolean | `true` |
| `createdAt` | timestamp | (click "Server timestamp") |
| `updatedAt` | timestamp | (click "Server timestamp") |

6. Click **Save**
import { advancedDiagnosis } from './src/utils/advancedDiagnostic.js';
await advancedDiagnosis();
✅ Your user profile is now created and login will work!

## Verify User Profile Creation

**CRITICAL**: Make sure Document ID matches UID exactly:

1. Go to Firebase Console > **Authentication > Users**
2. Find `owner@gympulse.com` and copy the **UID**
3. Go to **Firestore Database > users collection**
4. Find the document you created
5. Check that:
   - ✅ Document ID = the UID (exactly matching)
   - ✅ `uid` field value = the UID
   - ✅ `email` field = `owner@gympulse.com`
   - ✅ `role` field = `OWNER`
   - ✅ `gymId` field = `demo-gym-001`

**Common mistake**: UID in Firebase Console looks like `jK7mL9pQ2rW3sT4uV5w...` - make sure the Document ID matches this exactly (including uppercase/lowercase).

## Step 9: Create Test Gym

1. Create collection: `gyms`
2. Add document with ID: `demo-gym-001`
3. Add fields:
   ```
   name: "Downtown Fitness"
   address: "123 Main Street"
   phone: "+91-9876543210"
   email: "info@downtownfitness.com"
   timezone: "Asia/Kolkata"
   currency: "INR"
   createdAt: (server timestamp)
   updatedAt: (server timestamp)
   ```

## Step 10: Create Membership Plans

1. In `gyms` > `demo-gym-001` > Create subcollection: `membershipPlans`
2. Add documents for each plan:

**Monthly**
```
name: "Monthly"
price: 1500
duration: 1
durationUnit: "Months"
description: "1 month unlimited access"
status: "ACTIVE"
```

**Quarterly**
```
name: "Quarterly"
price: 4000
duration: 3
durationUnit: "Months"
description: "3 months unlimited access"
status: "ACTIVE"
```

**Half Yearly**
```
name: "Half Yearly"
price: 7500
duration: 6
durationUnit: "Months"
description: "6 months unlimited access"
status: "ACTIVE"
```

**Annual**
```
name: "Annual"
price: 12000
duration: 12
durationUnit: "Months"
description: "12 months unlimited access"
status: "ACTIVE"
```

## Step 11: Populate Collections with Mock Data

Once your gym and membership plans are created, populate other collections:

### Option A: Using the Seeding Component (Easiest)

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173/admin/seed`
3. Enter Gym ID: `demo-gym-001`
4. Click **"Seed Collections"**
5. Wait for completion ✅

This creates:
- 3 trainers
- 5 members
- 5 memberships
- 5 attendance records
- 5 payments

### Option B: Using Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Paste and run:

```javascript
import { seedDatabase } from './src/firebase/seedDatabase.js';
await seedDatabase('gympulse-afcb1', 'demo-gym-001');
```

For details, see [DATABASE_SEEDING.md](./DATABASE_SEEDING.md)

## Step 12: Start Development

```bash
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Navigate to http://localhost:5173
# Login with:
#   Email: owner@gympulse.com
#   Password: Demo@123
```

## Production Build

When Node 20+ is available:

```bash
npm run build
# Deploy dist folder to Vercel
```

## Troubleshooting

### ❌ "User profile not found. Please contact support."

**Cause**: User exists in Firebase Authentication but NOT found in Firestore `users` collection.

**Solution - Step 1: Use Diagnostic Tool**

1. Open browser DevTools (F12 → Console tab)
2. Copy and paste:
```javascript
import { diagnoseLoginIssue } from './src/utils/loginDiagnostic.js';
await diagnoseLoginIssue();
```
3. This will show you the exact UID and tell you what's wrong

**Solution - Step 2: Manual Fix**

If diagnostic shows "User profile NOT found":

1. Go to Firebase Console > **Firestore Database**
2. Open the `users` collection
3. Click **Add document**
4. **CRITICAL**: Document ID must be the UID from Firebase Console exactly
5. Add these fields:
   ```
   uid      (string)    → [paste the UID exactly]
   email    (string)    → owner@gympulse.com
   name     (string)    → Demo Owner
   role     (string)    → OWNER
   gymId    (string)    → demo-gym-001
   active   (boolean)   → true
   createdAt (timestamp) → Server timestamp
   updatedAt (timestamp) → Server timestamp
   ```
6. Click **Save**
7. Refresh browser and login again

**Most Common Mistake**: Document ID doesn't match UID exactly (case-sensitive, character-by-character)

### ❌ "Permission denied" on login
- Check `.env` variables are correct and match Firebase config
- Verify user document exists in Firestore
- Verify Document ID matches user's UID exactly
- Check Firestore rules are deployed

### ❌ "Cannot read property of undefined" errors
- Make sure Firestore collections exist (`users`, `gyms`, `membershipPlans`)
- Check document IDs match exactly
- Verify Firebase initialization loaded correctly
- Check browser console for detailed error

### ❌ Collections not appearing in Firestore
- Refresh Firebase Console
- Check you're viewing the correct Firestore database
- Verify Gym ID path: `gyms/{gymId}/` for subcollections

### ❌ Build fails with Node 16
- Upgrade to Node 20+ (required for newer Firebase SDK)
- Use CI/CD system that has Node 20+
- Deploy to Vercel (handles build automatically)

## Testing Checklist

Before proceeding to development:

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Firestore rules deployed
- [ ] Admin user created in Firebase Auth (`owner@gympulse.com`)
- [ ] User profile document created in Firestore ⚠️ **CRITICAL**
- [ ] Gym document created (`demo-gym-001`)
- [ ] Membership plans created (Monthly, Quarterly, Annual, etc.)
- [ ] Database seeded with mock data (or will do manually)
- [ ] Dev server starts: `npm run dev`
- [ ] Can login with credentials: `owner@gympulse.com` / `Demo@123`
- [ ] Dashboard loads after login ✅
- [ ] Can navigate to different pages
- [ ] Logout works
- [ ] Refresh page maintains login state

## Next Steps

Once Firebase is set up:
1. Populate test data (members, trainers, attendance)
2. Test CRUD operations
3. Test image uploads
4. Test multi-gym isolation
5. Run production build (with Node 20+)
6. Deploy to Vercel

## Support

For Firebase documentation: https://firebase.google.com/docs
For GymPulse issues: See PHASE3_IMPLEMENTATION.md

---

**Last Updated**: Phase 3 Complete
**Stability**: Ready for Development
