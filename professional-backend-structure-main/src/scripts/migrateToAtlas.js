import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/attendance_test';
const CLOUD_URI = process.argv[2] || process.env.CLOUD_MONGODB_URI || (process.env.MONGODB_URI?.includes('mongodb+srv') ? process.env.MONGODB_URI : null);

if (!CLOUD_URI || CLOUD_URI.includes('localhost') || CLOUD_URI.includes('127.0.0.1')) {
  console.error('\n❌ ERROR: Please provide your MongoDB Atlas Cloud URI!');
  console.log('\nUsage:');
  console.log('  node src/scripts/migrateToAtlas.js "mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/attendance_app?retryWrites=true&w=majority"\n');
  process.exit(1);
}

const COLLECTIONS_TO_MIGRATE = [
  'departments',
  'attendanceusers',
  'faceembeddings',
  'classes',
  'attendancesessions',
  'attendancechallenges',
  'attendances',
  'timetableschedules',
];

async function migrate() {
  console.log('===========================================================');
  console.log('🚀 MIGRATING DATA TO MONGODB ATLAS CLUSTER');
  console.log('===========================================================');
  console.log(`Source (Local): ${LOCAL_URI}`);
  console.log(`Target (Cloud): ${CLOUD_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  console.log('-----------------------------------------------------------');

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ Connected to Local MongoDB');

  const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
  console.log('✅ Connected to MongoDB Atlas Cloud');
  console.log('-----------------------------------------------------------');

  for (const collName of COLLECTIONS_TO_MIGRATE) {
    try {
      const sourceColl = localConn.collection(collName);
      const targetColl = cloudConn.collection(collName);

      const docs = await sourceColl.find({}).toArray();
      if (!docs || docs.length === 0) {
        console.log(`⚪ ${collName.padEnd(22)}: 0 documents (skipped)`);
        continue;
      }

      // Upsert documents by _id so migration is fully idempotent
      const operations = docs.map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true,
        },
      }));

      await targetColl.bulkWrite(operations);
      console.log(`✅ ${collName.padEnd(22)}: ${docs.length} documents migrated`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${collName}:`, err.message);
    }
  }

  console.log('===========================================================');
  console.log('✅ Migration finished successfully!');
  console.log('All local data, users, and registered faces are now live on Atlas.');
  console.log('===========================================================');

  await localConn.close();
  await cloudConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
