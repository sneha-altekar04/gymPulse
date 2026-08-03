/**
 * Firebase Database Seeding Utility
 * Populates Firestore with mock data for development
 * 
 * Usage in browser console:
 * import { seedDatabase } from './firebase/seedDatabase.js'
 * await seedDatabase('gympulse-afcb1', 'demo-gym-001')
 */

import { db } from './firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

// Mock Data
const membersSeed = [
  {
    memberCode: 'MBR-2026-001',
    fullName: 'Rahul Patil',
    mobile: '9823011001',
    email: 'rahul.patil@example.com',
    gender: 'Male',
    dateOfBirth: '1993-06-12',
    address: 'Baner, Pune',
    emergencyContactName: 'Sunita Patil',
    emergencyContactNumber: '9890011001',
    joiningDate: new Date('2025-11-12'),
    trainerId: 'trainer-001',
    deviceUserId: 'FP-101',
    status: 'ACTIVE'
  },
  {
    memberCode: 'MBR-2026-002',
    fullName: 'Sneha More',
    mobile: '9823011002',
    email: 'sneha.more@example.com',
    gender: 'Female',
    dateOfBirth: '1997-01-24',
    address: 'Kothrud, Pune',
    emergencyContactName: 'Anita More',
    emergencyContactNumber: '9890011002',
    joiningDate: new Date('2026-02-08'),
    trainerId: 'trainer-002',
    deviceUserId: 'FP-102',
    status: 'ACTIVE'
  },
  {
    memberCode: 'MBR-2026-003',
    fullName: 'Amit Jadhav',
    mobile: '9823011003',
    email: 'amit.jadhav@example.com',
    gender: 'Male',
    dateOfBirth: '1991-10-03',
    address: 'Wakad, Pune',
    emergencyContactName: 'Vaishali Jadhav',
    emergencyContactNumber: '9890011003',
    joiningDate: new Date('2025-09-20'),
    trainerId: 'trainer-003',
    deviceUserId: 'FP-103',
    status: 'ACTIVE'
  },
  {
    memberCode: 'MBR-2026-004',
    fullName: 'Priya Deshmukh',
    mobile: '9823011004',
    email: 'priya.deshmukh@example.com',
    gender: 'Female',
    dateOfBirth: '1995-05-07',
    address: 'Viman Nagar, Pune',
    emergencyContactName: 'Vijay Deshmukh',
    emergencyContactNumber: '9890011004',
    joiningDate: new Date('2026-03-15'),
    trainerId: 'trainer-001',
    deviceUserId: 'FP-104',
    status: 'ACTIVE'
  },
  {
    memberCode: 'MBR-2026-005',
    fullName: 'Rohan Kulkarni',
    mobile: '9823011005',
    email: 'rohan.kulkarni@example.com',
    gender: 'Male',
    dateOfBirth: '1992-09-14',
    address: 'Magarpatta, Pune',
    emergencyContactName: 'Neha Kulkarni',
    emergencyContactNumber: '9890011005',
    joiningDate: new Date('2025-12-01'),
    trainerId: 'trainer-002',
    deviceUserId: 'FP-105',
    status: 'ACTIVE'
  }
];

const trainersSeed = [
  {
    fullName: 'Karan Naik',
    mobile: '9876512301',
    email: 'karan.naik@gympulse.demo',
    gender: 'Male',
    specialization: 'Strength and Conditioning',
    joiningDate: new Date('2024-01-18'),
    status: 'ACTIVE'
  },
  {
    fullName: 'Ritika Shah',
    mobile: '9876512302',
    email: 'ritika.shah@gympulse.demo',
    gender: 'Female',
    specialization: 'Weight Loss and Functional Fitness',
    joiningDate: new Date('2024-05-02'),
    status: 'ACTIVE'
  },
  {
    fullName: 'Omkar Chavan',
    mobile: '9876512303',
    email: 'omkar.chavan@gympulse.demo',
    gender: 'Male',
    specialization: 'Bodybuilding',
    joiningDate: new Date('2023-09-26'),
    status: 'ACTIVE'
  }
];

const attendanceSeed = [
  {
    memberId: 'member-001',
    checkInTime: new Date('2026-07-31T06:08:00'),
    checkOutTime: new Date('2026-07-31T07:15:00'),
    source: 'FINGERPRINT',
    membershipStatus: 'ACTIVE',
    createdAt: new Date('2026-07-31T06:08:02')
  },
  {
    memberId: 'member-002',
    checkInTime: new Date('2026-07-31T06:22:00'),
    checkOutTime: null,
    source: 'FINGERPRINT',
    membershipStatus: 'ACTIVE',
    createdAt: new Date('2026-07-31T06:22:04')
  },
  {
    memberId: 'member-003',
    checkInTime: new Date('2026-07-31T06:35:00'),
    checkOutTime: null,
    source: 'FINGERPRINT',
    membershipStatus: 'ACTIVE',
    createdAt: new Date('2026-07-31T06:35:05')
  },
  {
    memberId: 'member-004',
    checkInTime: new Date('2026-07-31T05:45:00'),
    checkOutTime: new Date('2026-07-31T06:50:00'),
    source: 'FINGERPRINT',
    membershipStatus: 'ACTIVE',
    createdAt: new Date('2026-07-31T05:45:03')
  },
  {
    memberId: 'member-005',
    checkInTime: new Date('2026-07-31T07:18:00'),
    checkOutTime: null,
    source: 'FINGERPRINT',
    membershipStatus: 'ACTIVE',
    createdAt: new Date('2026-07-31T07:18:06')
  }
];

const paymentsSeed = [
  {
    memberId: 'member-001',
    membershipId: 'membership-001',
    receiptNumber: 'RCP-2026-0001',
    amount: 1500,
    paymentMode: 'CASH',
    paymentDate: new Date('2026-07-15'),
    status: 'PAID',
    notes: 'Monthly plan renewal',
    createdAt: new Date('2026-07-15T10:30:00')
  },
  {
    memberId: 'member-002',
    membershipId: 'membership-002',
    receiptNumber: 'RCP-2026-0002',
    amount: 4000,
    paymentMode: 'UPI',
    paymentDate: new Date('2026-07-20'),
    status: 'PAID',
    notes: 'Quarterly plan',
    createdAt: new Date('2026-07-20T14:00:00')
  },
  {
    memberId: 'member-003',
    membershipId: 'membership-003',
    receiptNumber: 'RCP-2026-0003',
    amount: 12000,
    paymentMode: 'CARD',
    paymentDate: new Date('2026-06-01'),
    status: 'PAID',
    notes: 'Annual plan',
    createdAt: new Date('2026-06-01T09:15:00')
  },
  {
    memberId: 'member-004',
    membershipId: 'membership-004',
    receiptNumber: 'RCP-2026-0004',
    amount: 1500,
    paymentMode: 'CASH',
    paymentDate: new Date('2026-07-25'),
    status: 'PAID',
    notes: '',
    createdAt: new Date('2026-07-25T11:45:00')
  },
  {
    memberId: 'member-005',
    membershipId: 'membership-005',
    receiptNumber: 'RCP-2026-0005',
    amount: 7500,
    paymentMode: 'BANK_TRANSFER',
    paymentDate: new Date('2026-07-10'),
    status: 'PAID',
    notes: 'Half yearly plan',
    createdAt: new Date('2026-07-10T16:20:00')
  }
];

const membershipPlansSeed = [
  {
    name: 'Monthly',
    duration: 30,
    durationUnit: 'Days',
    price: 1500,
    description: 'Monthly gym access',
    active: true
  },
  {
    name: 'Quarterly',
    duration: 90,
    durationUnit: 'Days',
    price: 4000,
    description: 'Quarterly gym access',
    active: true
  },
  {
    name: 'Half Yearly',
    duration: 180,
    durationUnit: 'Days',
    price: 7500,
    description: 'Half yearly gym access',
    active: true
  },
  {
    name: 'Annual',
    duration: 365,
    durationUnit: 'Days',
    price: 12000,
    description: 'Annual gym access',
    active: true
  }
];

const membershipsSeed = [
  {
    memberId: 'member-001',
    planId: 'plan-001',
    startDate: new Date('2026-07-15'),
    endDate: new Date('2026-08-15'),
    originalAmount: 1500,
    discount: 0,
    finalAmount: 1500,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-15')
  },
  {
    memberId: 'member-002',
    planId: 'plan-002',
    startDate: new Date('2026-07-20'),
    endDate: new Date('2026-10-20'),
    originalAmount: 4000,
    discount: 0,
    finalAmount: 4000,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-20')
  },
  {
    memberId: 'member-003',
    planId: 'plan-004',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2027-06-01'),
    originalAmount: 12000,
    discount: 500,
    finalAmount: 11500,
    status: 'ACTIVE',
    createdAt: new Date('2026-06-01')
  },
  {
    memberId: 'member-004',
    planId: 'plan-001',
    startDate: new Date('2026-07-25'),
    endDate: new Date('2026-08-25'),
    originalAmount: 1500,
    discount: 0,
    finalAmount: 1500,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-25')
  },
  {
    memberId: 'member-005',
    planId: 'plan-003',
    startDate: new Date('2026-07-10'),
    endDate: new Date('2027-01-10'),
    originalAmount: 7500,
    discount: 0,
    finalAmount: 7500,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-10')
  }
];

/**
 * Seed database with mock data
 * @param {string} projectId - Firebase project ID
 * @param {string} gymId - Gym ID to seed data for
 */
export const seedDatabase = async (projectId, gymId) => {
  try {
    console.log('🌱 Starting database seeding...');

    const batch = writeBatch(db);
    let docCount = 0;

    // 1. Add Trainers
    console.log('📝 Seeding trainers...');
    for (let i = 0; i < trainersSeed.length; i++) {
      const trainerId = `trainer-${String(i + 1).padStart(3, '0')}`;
      const trainerRef = doc(db, `gyms/${gymId}/trainers`, trainerId);
      batch.set(trainerRef, {
        ...trainersSeed[i],
        gymId
      });
      docCount++;
    }

    // 2. Add Members
    console.log('👥 Seeding members...');
    for (let i = 0; i < membersSeed.length; i++) {
      const memberId = `member-${String(i + 1).padStart(3, '0')}`;
      const memberRef = doc(db, `gyms/${gymId}/members`, memberId);
      batch.set(memberRef, {
        ...membersSeed[i],
        gymId
      });
      docCount++;
    }

    // 3. Add Membership Plans
    console.log('📋 Seeding membership plans...');
    for (let i = 0; i < membershipPlansSeed.length; i++) {
      const planId = `plan-${String(i + 1).padStart(3, '0')}`;
      const planRef = doc(db, `gyms/${gymId}/membershipPlans`, planId);
      batch.set(planRef, {
        ...membershipPlansSeed[i],
        gymId
      });
      docCount++;
    }

    // 4. Add Memberships
    console.log('🎫 Seeding memberships...');
    for (let i = 0; i < membershipsSeed.length; i++) {
      const membershipId = `membership-${String(i + 1).padStart(3, '0')}`;
      const membershipRef = doc(db, `gyms/${gymId}/memberships`, membershipId);
      batch.set(membershipRef, {
        ...membershipsSeed[i],
        gymId
      });
      docCount++;
    }

    // 5. Add Attendance
    console.log('✅ Seeding attendance...');
    for (let i = 0; i < attendanceSeed.length; i++) {
      const attendanceId = `attendance-${String(i + 1).padStart(3, '0')}`;
      const attendanceRef = doc(db, `gyms/${gymId}/attendance`, attendanceId);
      batch.set(attendanceRef, {
        ...attendanceSeed[i],
        gymId
      });
      docCount++;
    }

    // 6. Add Payments
    console.log('💰 Seeding payments...');
    for (let i = 0; i < paymentsSeed.length; i++) {
      const paymentId = `payment-${String(i + 1).padStart(3, '0')}`;
      const paymentRef = doc(db, `gyms/${gymId}/payments`, paymentId);
      batch.set(paymentRef, {
        ...paymentsSeed[i],
        gymId
      });
      docCount++;
    }

    // Commit batch
    await batch.commit();

    console.log(`✅ Database seeding complete! Added ${docCount} documents.`);
    console.log('📊 Collections created:');
    console.log('  ✓ trainers');
    console.log('  ✓ members');
    console.log('  ✓ membershipPlans');
    console.log('  ✓ memberships');
    console.log('  ✓ attendance');
    console.log('  ✓ payments');
    
    return { success: true, documentsAdded: docCount };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
