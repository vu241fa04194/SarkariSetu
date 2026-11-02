import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Scheme from './models/Scheme.js';
import User from './models/User.js';
import Application from './models/Application.js';
import Notification from './models/Notification.js';
import { sampleSchemes } from './data/sampleSchemes.js';

dotenv.config();

/**
 * Import sample data into MongoDB database
 */
const importData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing existing schemes, users, applications, and notifications...');
    await Scheme.deleteMany({});
    await User.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Default Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sarkarisetu.gov.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SarkariSetu2026';
    console.log(`[Seeder] Creating Default Admin User (${adminEmail})...`);
    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      state: 'Delhi',
      occupation: 'Government Employee',
    });
    console.log(`[Seeder] Admin created: ${adminEmail} (Role: admin)`);

    // 2. Create Default Citizen User
    const citizenEmail = process.env.DEMO_CITIZEN_EMAIL || 'ramesh.kumar@example.com';
    const citizenPassword = process.env.DEMO_CITIZEN_PASSWORD || 'password123';
    console.log(`[Seeder] Creating Default Demo Citizen (${citizenEmail})...`);
    const demoCitizen = await User.create({
      name: 'Ramesh Kumar',
      email: citizenEmail,
      password: citizenPassword,
      role: 'citizen',
      age: 38,
      gender: 'Male',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      occupation: 'Farmer',
      annualIncome: 180000,
      ruralOrUrban: 'Rural',
      farmerStatus: true,
      studentStatus: false,
      disabilityStatus: false,
      category: 'OBC',
    });
    console.log(`[Seeder] Citizen created: ${citizenEmail} (Role: citizen)`);

    // 3. Prepare Enhanced Schemes with Phase 3 Source & Verification Fields
    console.log(`[Seeder] Inserting ${sampleSchemes.length} sample schemes with Phase 3 attributes...`);
    const enhancedSchemes = sampleSchemes.map((scheme, index) => {
      // Alternate verification states: 3 of 4 verified, 1 of 4 pending verification
      const isVerified = index % 4 !== 3;
      const viewsCount = Math.floor(Math.random() * 250) + 40;

      return {
        ...scheme,
        status: 'Active',
        verificationStatus: isVerified ? 'Verified' : 'Pending Verification',
        verifiedAt: isVerified ? new Date('2025-01-10') : null,
        verifiedBy: isVerified ? adminUser._id : null,
        sourceName:
          scheme.state === 'All India'
            ? 'Official Central Ministry Portal'
            : `Official ${scheme.state} State Portal`,
        sourceURL: scheme.officialWebsite || '',
        sourceType:
          scheme.state === 'All India' ? 'Central Government' : 'State Government',
        lastVerifiedAt: isVerified ? new Date('2025-01-10') : null,
        viewsCount,
      };
    });

    const createdSchemes = await Scheme.insertMany(enhancedSchemes);
    console.log(`[Seeder] Successfully imported ${createdSchemes.length} schemes!`);

    // 4. Attach saved schemes to demo citizen
    const savedIds = [createdSchemes[0]._id, createdSchemes[1]._id, createdSchemes[4]._id];
    demoCitizen.savedSchemes = savedIds;
    demoCitizen.recentlyViewedSchemes = [
      { scheme: createdSchemes[0]._id, viewedAt: new Date() },
      { scheme: createdSchemes[1]._id, viewedAt: new Date(Date.now() - 3600000) },
    ];
    await demoCitizen.save();

    // 5. Create sample application tracking records
    console.log('[Seeder] Creating sample citizen application tracking records...');
    await Application.create([
      {
        user: demoCitizen._id,
        scheme: createdSchemes[0]._id, // PM-KISAN
        status: 'Applied',
        applicationDate: new Date('2025-01-15'),
        referenceNumber: 'UP-KISAN-2025-8849',
        notes: 'Submitted land records and verified Aadhaar OTP at CSC Centre.',
      },
      {
        user: demoCitizen._id,
        scheme: createdSchemes[1]._id, // Ayushman Bharat
        status: 'Interested',
        notes: 'Checking family SECC list with Gram Panchayat Secretary.',
      },
      {
        user: demoCitizen._id,
        scheme: createdSchemes[4]._id, // PMKSY
        status: 'Completed',
        applicationDate: new Date('2024-11-20'),
        referenceNumber: 'PMKSY-IRR-9021',
        notes: 'Drip irrigation installation subsidy approved and disbursed.',
      },
    ]);

    // 6. Create sample notifications for citizen
    console.log('[Seeder] Creating sample citizen notifications...');
    await Notification.create([
      {
        user: demoCitizen._id,
        title: 'Welcome to SarkariSetu Platform',
        message: 'Your citizen account is active. Use the Smart Eligibility Finder to discover schemes matching your profile.',
        type: 'system',
        link: '/eligibility',
        read: true,
      },
      {
        user: demoCitizen._id,
        title: 'Scheme Guidelines Updated: PM-KISAN',
        message: 'The nodal ministry has updated mandatory e-KYC deadlines for the upcoming installment tranche.',
        type: 'scheme_update',
        link: `/schemes/${createdSchemes[0]._id}`,
        read: false,
      },
      {
        user: demoCitizen._id,
        title: 'New Welfare Match Available',
        message: 'A new agriculture infrastructure scheme has been added that matches your Farmer profile in Uttar Pradesh.',
        type: 'eligibility',
        link: '/dashboard',
        read: false,
      },
    ]);

    console.log('======================================================');
    console.log(' SARKARISETU SEED COMPLETE (PHASE 4 - PRODUCTION READY)');
    console.log(` Admin Account: ${adminEmail} (password configured in .env)`);
    console.log(` Citizen Account: ${citizenEmail} (password configured in .env)`);
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] Failed to import data: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Destroy/Wipe data from MongoDB
 */
const destroyData = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Wiping database collections...');
    await Scheme.deleteMany({});
    await User.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seeder] Database cleared.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] Failed to destroy data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
