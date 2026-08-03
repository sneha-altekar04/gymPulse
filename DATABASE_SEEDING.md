# Database Seeding Guide

This guide explains how to populate your Firestore database with mock data for development.

## What Gets Created

The seeding utility creates mock data for 5 collections under your gym:

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| **trainers** | 3 | Fitness trainers with profiles |
| **members** | 5 | Gym members with contact info |
| **memberships** | 5 | Active membership records |
| **attendance** | 5 | Check-in/check-out records |
| **payments** | 5 | Payment receipts |

## Prerequisites

✅ Firebase project created  
✅ Firestore database initialized  
✅ Authentication configured  
✅ Gym document created (e.g., `demo-gym-001`)  
✅ Membership plans created  

## Method 1: Using the Seeding Component

### Step 1: Add Route to Router

Open `src/router/index.js` and add this route (optional, for easy access):

```javascript
{
  path: '/admin/seed',
  component: () => import('../components/admin/DatabaseSeedingView.vue'),
  meta: { requiresAuth: true }
}
```

### Step 2: Run the Seeding Tool

1. Navigate to `http://localhost:5173/admin/seed` (if you added the route)
2. Enter your Gym ID (e.g., `demo-gym-001`)
3. Click **"Seed Collections"**
4. Wait for completion ✅

### Step 3: Verify in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore Database
3. Navigate to `gyms` > `demo-gym-001`
4. You should see collections:
   - `trainers` (3 documents)
   - `members` (5 documents)
   - `memberships` (5 documents)
   - `attendance` (5 documents)
   - `payments` (5 documents)

## Method 2: Using Browser Console

If you don't want to add a route, you can seed directly from the browser console:

### Step 1: Open Browser Console

Press `F12` → Go to **Console** tab

### Step 2: Run Seeding Command

```javascript
// Import the seeding function (if using ES modules)
import { seedDatabase } from './src/firebase/seedDatabase.js';

// Seed the database
await seedDatabase('gympulse-afcb1', 'demo-gym-001');
```

Replace `'gympulse-afcb1'` with your Firebase Project ID and `'demo-gym-001'` with your Gym ID.

### Step 3: Wait for Completion

Console will show:
```
🌱 Starting database seeding...
📝 Seeding trainers...
👥 Seeding members...
🎫 Seeding memberships...
✅ Seeding attendance...
💰 Seeding payments...
✅ Database seeding complete! Added 23 documents.
```

## Mock Data Included

### Trainers (3)
- Karan Naik (Strength & Conditioning)
- Ritika Shah (Weight Loss & Functional Fitness)
- Omkar Chavan (Bodybuilding)

### Members (5)
- Rahul Patil
- Sneha More
- Amit Jadhav
- Priya Deshmukh
- Rohan Kulkarni

### Memberships (5)
- 1-Month plans (2)
- Quarterly plan (1)
- Semi-Annual plan (1)
- Annual plan (1)
- All with ACTIVE status

### Attendance (5)
- Today's check-ins (2026-07-31)
- Mix of completed and ongoing sessions
- All using FINGERPRINT source

### Payments (5)
- Various payment modes (Cash, UPI, Card, Bank Transfer)
- All with PAID status
- Receipt numbers: RCP-2026-0001 to RCP-2026-0005

## Additional Collections (Manual Setup)

After seeding, you may want to add more data:

### devices (Optional)
Store fingerprint device mappings:
```json
{
  "deviceCode": "DEV-001",
  "model": "ZKTeco U160",
  "location": "Main Entrance",
  "active": true,
  "lastSyncAt": "2026-07-31T07:30:00"
}
```

### settings (Optional)
Store gym settings:
```json
{
  "businessHours": {
    "open": "06:00 AM",
    "close": "10:00 PM"
  },
  "membershipAutoRenewal": false,
  "expiryNotificationDays": 7
}
```

### dailyStats (Auto-generated)
System automatically generates daily statistics:
- `attendanceCount` - Total check-ins
- `collectionAmount` - Total payments
- `newMembers` - New signups
- `renewals` - Renewals

## Troubleshooting

### "Permission denied" Error
- Check Firestore security rules are deployed
- Verify user has OWNER or ADMIN role
- Check gym ID exists in Firestore

### "Document not found" Error
- Ensure gym document exists in `gyms` collection
- Double-check Gym ID spelling
- Create gym manually if needed

### Nothing appears in Firestore
- Refresh Firebase Console
- Check collections under `gyms/{gymId}/`
- Verify no errors in browser console

### Want to Clear Data?
Delete the collections manually in Firebase Console:
1. Open Firestore Database
2. Right-click collection name
3. Select "Delete collection"
4. Re-run seeding

## Collections Data Model

### members/{memberId}
```
{
  memberCode: "MBR-2026-001",
  fullName: "Rahul Patil",
  mobile: "9823011001",
  email: "rahul.patil@example.com",
  gender: "Male",
  dateOfBirth: "1993-06-12",
  address: "Baner, Pune",
  emergencyContactName: "Sunita Patil",
  emergencyContactNumber: "9890011001",
  joiningDate: Timestamp,
  trainerId: "trainer-001",
  deviceUserId: "FP-101",
  status: "ACTIVE",
  gymId: "demo-gym-001"
}
```

### trainers/{trainerId}
```
{
  fullName: "Karan Naik",
  mobile: "9876512301",
  email: "karan.naik@gympulse.demo",
  gender: "Male",
  specialization: "Strength and Conditioning",
  joiningDate: Timestamp,
  status: "ACTIVE",
  gymId: "demo-gym-001"
}
```

### memberships/{membershipId}
```
{
  memberId: "member-001",
  planId: "plan-001",
  startDate: Timestamp,
  endDate: Timestamp,
  originalAmount: 1500,
  discount: 0,
  finalAmount: 1500,
  status: "ACTIVE",
  createdAt: Timestamp,
  gymId: "demo-gym-001"
}
```

### attendance/{attendanceId}
```
{
  memberId: "member-001",
  checkInTime: Timestamp,
  checkOutTime: Timestamp,
  source: "FINGERPRINT",
  membershipStatus: "ACTIVE",
  createdAt: Timestamp,
  gymId: "demo-gym-001"
}
```

### payments/{paymentId}
```
{
  memberId: "member-001",
  membershipId: "membership-001",
  receiptNumber: "RCP-2026-0001",
  amount: 1500,
  paymentMode: "CASH",
  paymentDate: Timestamp,
  status: "PAID",
  notes: "Monthly plan renewal",
  createdAt: Timestamp,
  gymId: "demo-gym-001"
}
```

## Next Steps

1. ✅ Run seeding
2. ✅ Verify data in Firebase Console
3. 🚀 Update frontend components to use real Firebase data
4. 🧪 Test application features
5. 📊 Monitor Firestore reads/writes

---

**Note**: This is for development only. In production, use proper data management practices and never expose seeding tools to end users.
