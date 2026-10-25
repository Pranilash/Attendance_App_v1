import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore
}

async function changeAdminPassword() {
  const email = process.argv[2] || 'admin@attendance.edu';
  const newPassword = process.argv[3];

  if (!newPassword) {
    console.error('Usage: node changeAdminPassword.js <email> <newPassword>');
    console.error('Example: node changeAdminPassword.js admin@attendance.edu MySecretPass@2026');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Error: Password must be at least 8 characters long for production security.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB Atlas...`);
  await mongoose.connect(mongoUri);

  const { AttendanceUser } = await import('../models/attendanceUser.model.js');
  const user = await AttendanceUser.findOne({ email }).select('+password');

  if (!user) {
    console.error(`Error: User with email "${email}" was not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword;
  await user.save();

  console.log(`=======================================================`);
  console.log(`SUCCESS: Password updated successfully for: ${email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Account Name: ${user.name}`);
  console.log(`=======================================================`);

  await mongoose.disconnect();
  process.exit(0);
}

changeAdminPassword().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
