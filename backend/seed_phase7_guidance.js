import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scheme from './models/Scheme.js';
import {
  generateDocumentRequirements,
  generateApplicationGuidance,
} from './utils/guidanceGenerator.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sarkarisetu';

export const runSeeder = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Phase 7 Guidance Seeder...');

    const schemes = await Scheme.find({});
    console.log(`Enriching ${schemes.length} schemes with Phase 7 Document Requirements and Application Guidance...`);

    let updatedCount = 0;
    for (const scheme of schemes) {
      scheme.documentRequirements = generateDocumentRequirements(scheme);
      scheme.applicationGuidance = generateApplicationGuidance(scheme);
      await scheme.save();
      updatedCount++;
    }

    console.log(`Successfully enriched ${updatedCount} schemes!`);
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error enriching schemes with Phase 7 data:', err);
    throw err;
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seed_phase7_guidance.js')) {
  runSeeder()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
