/**
 * Firestore Seed Data Script
 * 
 * This script populates initial test data into Firestore.
 * Run this AFTER creating a Firebase project and authenticating.
 * 
 * Usage in browser console:
 * 1. Go to http://localhost:5173 (dev server)
 * 2. Open browser DevTools (F12)
 * 3. Copy and run this script in console
 */

// Import Firebase functions (these should be available from main app context)
// This is a template - adapt based on your actual Firebase setup

async function seedDatabase() {
  console.log('Starting Firestore seed data...');

  try {
    // Create a test gym
    // const gymData = {
    //   name: 'Downtown Fitness',
    //   address: '123 Main Street, Downtown',
    //   phone: '+91-9876543210',
    //   email: 'info@downtownfitness.com',
    //   timezone: 'Asia/Kolkata',
    //   currency: 'INR',
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // };

    // // Create membership plans
    // const plansData = [
    //   {
    //     gymId: 'YOUR_GYM_ID', // Replace with actual gym ID
    //     name: 'Monthly',
    //     price: 1500,
    //     duration: 1,
    //     durationUnit: 'Months',
    //     description: '1 month unlimited access',
    //     status: 'ACTIVE',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     gymId: 'YOUR_GYM_ID',
    //     name: 'Quarterly',
    //     price: 4000,
    //     duration: 3,
    //     durationUnit: 'Months',
    //     description: '3 months unlimited access',
    //     status: 'ACTIVE',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     gymId: 'YOUR_GYM_ID',
    //     name: 'Half Yearly',
    //     price: 7500,
    //     duration: 6,
    //     durationUnit: 'Months',
    //     description: '6 months unlimited access',
    //     status: 'ACTIVE',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     gymId: 'YOUR_GYM_ID',
    //     name: 'Annual',
    //     price: 12000,
    //     duration: 12,
    //     durationUnit: 'Months',
    //     description: '12 months unlimited access',
    //     status: 'ACTIVE',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // ];

    // Create test members
    const membersData = [
      {
        gymId: 'YOUR_GYM_ID',
        memberCode: 'MEM001',
        firstName: 'Rahul',
        lastName: 'Patil',
        fullName: 'Rahul Patil',
        phone: '+91-9876543211',
        email: 'rahul@example.com',
        gender: 'Male',
        dob: '1990-05-15',
        address: 'Pune, Maharashtra',
        emergencyContact: '+91-9876543212',
        joiningDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        gymId: 'YOUR_GYM_ID',
        memberCode: 'MEM002',
        firstName: 'Sneha',
        lastName: 'More',
        fullName: 'Sneha More',
        phone: '+91-9876543220',
        email: 'sneha@example.com',
        gender: 'Female',
        dob: '1992-08-22',
        address: 'Mumbai, Maharashtra',
        emergencyContact: '+91-9876543221',
        joiningDate: new Date('2024-02-10'),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create test trainers
    const trainersData = [
      {
        gymId: 'YOUR_GYM_ID',
        name: 'Amit Jadhav',
        phone: '+91-9876543230',
        email: 'amit@example.com',
        specialization: 'Strength Training',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        gymId: 'YOUR_GYM_ID',
        name: 'Priya Deshmukh',
        phone: '+91-9876543240',
        email: 'priya@example.com',
        specialization: 'Yoga & Flexibility',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('Seed data prepared:', {
      gym: gymData,
      plans: plansData.length,
      members: membersData.length,
      trainers: trainersData.length
    });

    console.log('TODO: Execute the following in Firebase Console or Admin SDK:');
    console.log('1. Create gym document');
    console.log('2. Create membership plans');
    console.log('3. Create members');
    console.log('4. Create trainers');
    console.log('5. Create attendance records');
    console.log('6. Create payment records');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Run seed
seedDatabase();
