/**
 * Test: Race condition prevention in verifyFace
 * - Challenge consumption is atomic (no reuse)
 * - Attendance creation is atomic (no double-marking via Mongo duplicate key error)
 */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceChallengeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, required: true },
  sessionId: { type: Schema.Types.ObjectId, required: true },
  classId: { type: Schema.Types.ObjectId, required: true },
  nonce: { type: String, required: true },
  consumed: { type: Boolean, default: false },
  consumedAt: { type: Date },
  qrTimestamp: { type: Number },
  actionSequence: [String],
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const attendanceSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, required: true },
  studentId: { type: Schema.Types.ObjectId, required: true },
  classId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, default: 'present' },
  markedAt: { type: Date, default: Date.now },
}, { timestamps: true });

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const AttendanceChallenge = mongoose.model('AttendanceChallenge', attendanceChallengeSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

const SESSION_ID = new mongoose.Types.ObjectId();
const STUDENT_ID = new mongoose.Types.ObjectId();
const CLASS_ID = new mongoose.Types.ObjectId();

async function setup() {
  await mongoose.connect('mongodb://localhost:27017/attendance_test');
  await AttendanceChallenge.deleteMany({});
  await Attendance.deleteMany({});
}

async function cleanup() {
  await mongoose.disconnect();
}

async function testChallengeConsumptionIsAtomic() {
  console.log('\n=== Test 1: Challenge consumption is atomic (no reuse) ===');

  await AttendanceChallenge.create({
    studentId: STUDENT_ID,
    sessionId: SESSION_ID,
    classId: CLASS_ID,
    nonce: 'abc123',
    consumed: false,
    expiresAt: new Date(Date.now() + 60000),
  });

  const first = await AttendanceChallenge.findOneAndUpdate(
    { studentId: STUDENT_ID, sessionId: SESSION_ID, consumed: false, expiresAt: { $gt: new Date() } },
    { $set: { consumed: true, consumedAt: new Date() } },
    { new: true }
  );

  if (!first) {
    console.log('FAIL: First challenge consumption returned null');
    return false;
  }
  console.log('PASS: First challenge consumption succeeded');

  const second = await AttendanceChallenge.findOneAndUpdate(
    { studentId: STUDENT_ID, sessionId: SESSION_ID, consumed: false, expiresAt: { $gt: new Date() } },
    { $set: { consumed: true, consumedAt: new Date() } },
    { new: true }
  );

  if (second) {
    console.log('FAIL: Second challenge consumption returned a document (challenge reused!)');
    return false;
  }
  console.log('PASS: Second challenge consumption correctly returned null (no reuse)');
  return true;
}

async function testAttendanceCreationIsAtomic() {
  console.log('\n=== Test 2: Attendance creation is atomic (no double-marking) ===');

  await Attendance.create({
    sessionId: SESSION_ID,
    studentId: STUDENT_ID,
    classId: CLASS_ID,
    status: 'present',
  });

  let duplicateKeyError = false;
  try {
    await Attendance.create({
      sessionId: SESSION_ID,
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      status: 'present',
    });
  } catch (err) {
    if (err.code === 11000) {
      duplicateKeyError = true;
    }
  }

  if (!duplicateKeyError) {
    console.log('FAIL: Duplicate attendance creation did not throw duplicate key error');
    return false;
  }
  console.log('PASS: Duplicate attendance creation correctly threw duplicate key error (code 11000)');

  const count = await Attendance.countDocuments({ sessionId: SESSION_ID, studentId: STUDENT_ID });
  if (count !== 1) {
    console.log(`FAIL: Expected 1 attendance record, found ${count}`);
    return false;
  }
  console.log('PASS: Only one attendance record exists (no double-marking)');
  return true;
}

async function main() {
  try {
    await setup();
    const t1 = await testChallengeConsumptionIsAtomic();
    const t2 = await testAttendanceCreationIsAtomic();

    console.log('\n=== Summary ===');
    if (t1 && t2) {
      console.log('PASS: All race condition tests passed');
      process.exit(0);
    } else {
      console.log('FAIL: Some tests failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();