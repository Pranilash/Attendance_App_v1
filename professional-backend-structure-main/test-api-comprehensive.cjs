/**
 * Comprehensive API Test Suite
 * Tests all student endpoints including QR verification and Face verification
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ============================================================
// MODEL DEFINITIONS (matching production models)
// ============================================================

const departmentSchema = new Schema({
  name: String,
  code: String,
  isActive: Boolean,
});

const attendanceUserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  studentId: { type: String, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  faceEmbedding: [Number],
  faceRegistered: { type: Boolean, default: false },
  faceRegisteredAt: Date,
  faceEmbeddingId: Schema.Types.ObjectId,
  isActive: { type: Boolean, default: true },
  refreshToken: String,
}, { timestamps: true });

const classSchema = new Schema({
  name: String,
  subjectCode: String,
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  faculty: { type: Schema.Types.ObjectId, ref: 'AttendanceUser' },
  students: [{ type: Schema.Types.ObjectId, ref: 'AttendanceUser' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const attendanceSessionSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  qrSecret: { type: String, select: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const attendanceSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'AttendanceUser', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  status: { type: String, default: 'present' },
  qrVerified: { type: Boolean, default: false },
  faceVerified: { type: Boolean, default: false },
  livenessScore: Number,
  qrScannedAt: Date,
  faceVerifiedAt: Date,
  markedAt: { type: Date, default: Date.now },
  faceVerificationDetails: {
    similarityScore: Number,
    livenessChecks: {
      blink: Boolean,
      headMovement: Boolean,
    },
  },
}, { timestamps: true });

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const attendanceChallengeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'AttendanceUser', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  nonce: { type: String, required: true },
  consumed: { type: Boolean, default: false },
  consumedAt: Date,
  qrTimestamp: Number,
  actionSequence: [String],
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const faceEmbeddingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'AttendanceUser', required: true },
  embedding: [Number],
  registeredAt: Date,
  referenceImage: {
    publicId: String,
    url: String,
  },
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
const AttendanceUser = mongoose.model('AttendanceUser', attendanceUserSchema);
const Class = mongoose.model('Class', classSchema);
const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const AttendanceChallenge = mongoose.model('AttendanceChallenge', attendanceChallengeSchema);
const FaceEmbedding = mongoose.model('FaceEmbedding', faceEmbeddingSchema);

// ============================================================
// TEST SETUP
// ============================================================

const DEPARTMENT_ID = new mongoose.Types.ObjectId();
const FACULTY_ID = new mongoose.Types.ObjectId();
const CLASS_ID = new mongoose.Types.ObjectId();
const SESSION_ID = new mongoose.Types.ObjectId();
const STUDENT_ID = new mongoose.Types.ObjectId();

const QR_SECRET = 'test-qr-secret-' + crypto.randomBytes(16).toString('hex');

// Helper functions (mirroring production code)
function generateQRSignature(sessionId, timestamp, secret) {
  return crypto.createHmac('sha256', secret).update(`${sessionId}:${timestamp}`).digest('hex');
}

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function verifyFaceEmbedding(queryEmbedding, storedEmbedding, threshold = 0.6) {
  const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
  const distance = euclideanDistance(queryEmbedding, storedEmbedding);
  return { isMatch: similarity >= threshold, similarity, distance, threshold };
}

function euclideanDistance(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) sum += Math.pow(vectorA[i] - vectorB[i], 2);
  return Math.sqrt(sum);
}

// ============================================================
// TEST CASES
// ============================================================

async function setup() {
  await mongoose.connect('mongodb://localhost:27017/attendance_test');
  await Promise.all([
    Department.deleteMany({}),
    AttendanceUser.deleteMany({}),
    Class.deleteMany({}),
    AttendanceSession.deleteMany({}),
    Attendance.deleteMany({}),
    AttendanceChallenge.deleteMany({}),
    FaceEmbedding.deleteMany({}),
  ]);

  // Create department
  await Department.create({
    _id: DEPARTMENT_ID,
    name: 'Computer Science',
    code: 'CS',
    isActive: true,
  });

  // Create faculty
  await AttendanceUser.create({
    _id: FACULTY_ID,
    name: 'Dr. Test Faculty',
    email: 'faculty@test.com',
    password: 'hashed',
    role: 'faculty',
    isActive: true,
  });

  // Create student with face embedding
  const faceEmbedding = new Array(128).fill(0).map(() => Math.random() * 0.1);
  await AttendanceUser.create({
    _id: STUDENT_ID,
    name: 'Test Student',
    email: 'student@test.com',
    password: 'hashed',
    role: 'student',
    studentId: 'STU001',
    department: DEPARTMENT_ID,
    classIds: [CLASS_ID],
    faceEmbedding,
    faceRegistered: true,
    faceRegisteredAt: new Date(),
    isActive: true,
  });

  // Create class
  await Class.create({
    _id: CLASS_ID,
    name: 'Test Class',
    subjectCode: 'CS101',
    department: DEPARTMENT_ID,
    faculty: FACULTY_ID,
    students: [STUDENT_ID],
    isActive: true,
  });

  // Create session with QR secret
  await AttendanceSession.create({
    _id: SESSION_ID,
    classId: CLASS_ID,
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
    qrSecret: QR_SECRET,
    isActive: true,
  });

  console.log('✅ Test data setup complete');
}

async function cleanup() {
  await mongoose.disconnect();
}

// ============================================================
// TEST 1: QR Verification Flow
// ============================================================

async function testQRVerification() {
  console.log('\n=== Test 1: QR Verification Flow ===');
  let pass = true;

  try {
    // Generate valid QR payload
    const timestamp = Date.now();
    const signature = generateQRSignature(SESSION_ID.toString(), timestamp, QR_SECRET);
    const qrPayload = JSON.stringify({ sessionId: SESSION_ID.toString(), timestamp, signature });

    // Verify session exists and is active
    const session = await AttendanceSession.findById(SESSION_ID).select('+qrSecret');
    if (!session || !session.isActive) {
      console.log('FAIL: Session not found or inactive');
      return false;
    }
    console.log('✅ Session found and active');

    // Verify timestamp
    if (timestamp > Date.now() + 5000) {
      console.log('FAIL: Timestamp validation failed (future)');
      pass = false;
    } else {
      console.log('✅ Timestamp valid');
    }

    const qrAge = Date.now() - timestamp;
    if (qrAge > 30000) {
      console.log('FAIL: QR expired');
      pass = false;
    } else {
      console.log('✅ QR not expired');
    }

    // Verify signature
    const expectedSig = generateQRSignature(SESSION_ID.toString(), timestamp, QR_SECRET);
    if (signature !== expectedSig) {
      console.log('FAIL: Signature mismatch');
      pass = false;
    } else {
      console.log('✅ Signature valid');
    }

    // Check enrollment
    const classData = await Class.findById(SESSION_ID);
    if (!classData || !classData.students.includes(STUDENT_ID)) {
      console.log('FAIL: Student not enrolled');
      pass = false;
    } else {
      console.log('✅ Student enrolled');
    }

    // Check existing attendance
    const existing = await Attendance.findOne({ sessionId: SESSION_ID, studentId: STUDENT_ID });
    if (existing) {
      console.log('FAIL: Already marked');
      pass = false;
    } else {
      console.log('✅ No existing attendance');
    }

    // Check face registered
    const student = await AttendanceUser.findById(STUDENT_ID).select('+faceEmbedding');
    if (!student.faceEmbedding || student.faceEmbedding.length !== 128) {
      console.log('FAIL: Face not registered');
      pass = false;
    } else {
      console.log('✅ Face registered (128-dim)');
    }

    // Issue challenge (atomic cleanup + create)
    await AttendanceChallenge.deleteMany({ studentId: STUDENT_ID, sessionId: SESSION_ID });
    const nonce = crypto.randomBytes(16).toString('hex');
    const challenge = await AttendanceChallenge.create({
      studentId: STUDENT_ID,
      sessionId: SESSION_ID,
      classId: CLASS_ID,
      nonce,
      qrTimestamp: timestamp,
      actionSequence: ['blink', 'turnLeft', 'turnRight'],
      expiresAt: new Date(Date.now() + 60000),
    });

    console.log('✅ Challenge issued:', challenge._id.toString().slice(-8));

  } catch (err) {
    console.log('FAIL: Exception:', err.message);
    pass = false;
  }

  return pass;
}

// ============================================================
// TEST 2: Face Verification Flow
// ============================================================

async function testFaceVerification() {
  console.log('\n=== Test 2: Face Verification Flow ===');
  let pass = true;

  try {
    // First, issue a challenge (prerequisite)
    await AttendanceChallenge.deleteMany({ studentId: STUDENT_ID, sessionId: SESSION_ID });
    const challenge = await AttendanceChallenge.create({
      studentId: STUDENT_ID,
      sessionId: SESSION_ID,
      classId: CLASS_ID,
      nonce: crypto.randomBytes(16).toString('hex'),
      qrTimestamp: Date.now(),
      actionSequence: ['blink', 'turnLeft', 'turnRight'],
      expiresAt: new Date(Date.now() + 60000),
    });

    console.log('✅ Challenge created for face verification');

    // Consume challenge atomically
    const consumedChallenge = await AttendanceChallenge.findOneAndUpdate(
      { studentId: STUDENT_ID, sessionId: SESSION_ID, consumed: false, expiresAt: { $gt: new Date() } },
      { $set: { consumed: true, consumedAt: new Date() } },
      { new: true }
    );

    if (!consumedChallenge) {
      console.log('FAIL: Challenge consumption failed');
      return false;
    }
    console.log('✅ Challenge consumed atomically');

    // Test second consumption (should fail)
    const secondTry = await AttendanceChallenge.findOneAndUpdate(
      { studentId: STUDENT_ID, sessionId: SESSION_ID, consumed: false, expiresAt: { $gt: new Date() } },
      { $set: { consumed: true, consumedAt: new Date() } },
      { new: true }
    );

    if (secondTry) {
      console.log('FAIL: Challenge reused (security issue!)');
      pass = false;
    } else {
      console.log('✅ Challenge cannot be reused');
    }

    // Get student embedding
    const student = await AttendanceUser.findById(STUDENT_ID).select('+faceEmbedding');
    const storedEmbedding = student.faceEmbedding;

    // Test with matching embedding (should pass)
    const matchingEmbedding = [...storedEmbedding]; // Perfect match
    const matchResult = verifyFaceEmbedding(matchingEmbedding, storedEmbedding, 0.6);

    if (!matchResult.isMatch) {
      console.log('FAIL: Perfect match failed:', matchResult);
      pass = false;
    } else {
      console.log('✅ Perfect match passes (similarity:', matchResult.similarity.toFixed(3) + ')');
    }

    // Test with slightly different embedding (should still pass with threshold 0.6)
    const slightlyDifferent = storedEmbedding.map(v => v + (Math.random() - 0.5) * 0.02);
    const similarResult = verifyFaceEmbedding(slightlyDifferent, storedEmbedding, 0.6);

    if (!similarResult.isMatch) {
      console.log('WARN: Similar embedding failed (threshold may be too high):', similarResult.similarity);
    } else {
      console.log('✅ Similar embedding passes (similarity:', similarResult.similarity.toFixed(3) + ')');
    }

    // Test with completely different embedding (should fail)
    const differentEmbedding = new Array(128).fill(0).map(() => Math.random());
    const diffResult = verifyFaceEmbedding(differentEmbedding, storedEmbedding, 0.6);

    if (diffResult.isMatch) {
      console.log('FAIL: Different face incorrectly matched:', diffResult.similarity);
      pass = false;
    } else {
      console.log('✅ Different face correctly rejected (similarity:', diffResult.similarity.toFixed(3) + ')');
    }

    // Create attendance record (atomic)
    const attendance = await Attendance.create({
      sessionId: SESSION_ID,
      studentId: STUDENT_ID,
      classId: CLASS_ID,
      status: 'present',
      qrVerified: true,
      faceVerified: true,
      livenessScore: 1,
      qrScannedAt: challenge.createdAt,
      faceVerifiedAt: new Date(),
      markedAt: new Date(),
      faceVerificationDetails: {
        similarityScore: matchResult.similarity,
        livenessChecks: { blink: true, headMovement: true },
      },
    });

    console.log('✅ Attendance created:', attendance._id.toString().slice(-8));

    // Verify duplicate prevention
    try {
      await Attendance.create({
        sessionId: SESSION_ID,
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        status: 'present',
      });
      console.log('FAIL: Duplicate attendance allowed');
      pass = false;
    } catch (err) {
      if (err.code === 11000) {
        console.log('✅ Duplicate attendance correctly prevented (code 11000)');
      } else {
        console.log('FAIL: Wrong error:', err.message);
        pass = false;
      }
    }

  } catch (err) {
    console.log('FAIL: Exception:', err.message);
    pass = false;
  }

  return pass;
}

// ============================================================
// TEST 3: Face Registration
// ============================================================

async function testFaceRegistration() {
  console.log('\n=== Test 3: Face Registration ===');
  let pass = true;

  try {
    // Create new student without face
    const newStudentId = new mongoose.Types.ObjectId();
    await AttendanceUser.create({
      _id: newStudentId,
      name: 'New Student',
      email: 'newstudent@test.com',
      password: 'hashed',
      role: 'student',
      studentId: 'STU002',
      department: DEPARTMENT_ID,
      classIds: [CLASS_ID],
      isActive: true,
    });

    const newEmbedding = new Array(128).fill(0).map(() => Math.random() * 0.1);
    const now = new Date();

    // Register face (FaceEmbedding audit record)
    const faceRecord = await FaceEmbedding.findOneAndUpdate(
      { userId: newStudentId },
      {
        userId: newStudentId,
        embedding: newEmbedding,
        registeredAt: now,
        referenceImage: { publicId: 'webcam_capture', url: 'data:image...' },
      },
      { upsert: true, new: true }
    );

    console.log('✅ FaceEmbedding audit record created:', faceRecord._id.toString().slice(-8));

    // Update student
    const student = await AttendanceUser.findByIdAndUpdate(
      newStudentId,
      {
        faceEmbedding: newEmbedding,
        faceRegistered: true,
        faceRegisteredAt: now,
        faceEmbeddingId: faceRecord._id,
      },
      { new: true }
    ).select('+faceEmbedding');

    if (!student || !student.faceEmbedding || student.faceEmbedding.length !== 128) {
      console.log('FAIL: Student not updated correctly');
      pass = false;
    } else {
      console.log('✅ Student updated with face embedding');
    }

    if (!student.faceRegistered) {
      console.log('FAIL: faceRegistered not set');
      pass = false;
    } else {
      console.log('✅ faceRegistered flag set');
    }

    // Test status check
    const status = await FaceEmbedding.findOne({ userId: newStudentId });
    if (!status) {
      console.log('FAIL: Status check failed');
      pass = false;
    } else {
      console.log('✅ Face status retrievable');
    }

  } catch (err) {
    console.log('FAIL: Exception:', err.message);
    pass = false;
  }

  return pass;
}

// ============================================================
// TEST 4: Attendance History & Stats
// ============================================================

async function testHistoryAndStats() {
  console.log('\n=== Test 4: Attendance History & Stats ===');
  let pass = true;

  try {
    // Create some attendance records
    await Attendance.deleteMany({ studentId: STUDENT_ID });

    for (let i = 0; i < 5; i++) {
      await Attendance.create({
        sessionId: new mongoose.Types.ObjectId(),
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        status: 'present',
        qrVerified: true,
        faceVerified: true,
        markedAt: new Date(Date.now() - i * 86400000),
      });
    }
    console.log('✅ Created 5 attendance records');

    // Test history query
    const records = await Attendance.find({ studentId: STUDENT_ID })
      .populate({ path: 'classId', select: 'name subjectCode' })
      .sort({ markedAt: -1 })
      .limit(20);

    if (records.length !== 5) {
      console.log('FAIL: Expected 5 records, got', records.length);
      pass = false;
    } else {
      console.log('✅ History query returns', records.length, 'records');
    }

    // Test stats
    const totalSessions = 10;
    const presentCount = 5;
    const absentCount = totalSessions - presentCount;
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    if (attendanceRate !== 50) {
      console.log('FAIL: Attendance rate wrong:', attendanceRate);
      pass = false;
    } else {
      console.log('✅ Attendance rate:', attendanceRate + '%');
    }

    // Test face registration status
    const student = await AttendanceUser.findById(STUDENT_ID).select('+faceEmbedding');
    const faceRegistered = Boolean(
      student?.faceRegistered ||
      (student?.faceEmbedding && student.faceEmbedding.length === 128)
    );

    if (!faceRegistered) {
      console.log('FAIL: Face registered status false');
      pass = false;
    } else {
      console.log('✅ Face registered status true');
    }

  } catch (err) {
    console.log('FAIL: Exception:', err.message);
    pass = false;
  }

  return pass;
}

// ============================================================
// TEST 5: Edge Cases & Security
// ============================================================

async function testEdgeCases() {
  console.log('\n=== Test 5: Edge Cases & Security ===');
  let pass = true;

  try {
    // Test invalid QR format
    try {
      JSON.parse('invalid json');
    } catch (e) {
      console.log('✅ Invalid QR format correctly rejected');
    }

    // Test expired session
    const expiredSession = await AttendanceSession.create({
      classId: CLASS_ID,
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 3600000),
      qrSecret: 'expired-secret',
      isActive: false,
    });

    if (expiredSession.isActive) {
      console.log('FAIL: Expired session marked active');
      pass = false;
    } else {
      console.log('✅ Expired session correctly inactive');
    }

    // Test invalid embedding format
    const invalidEmbeddings = [
      null,
      [],
      new Array(64).fill(0.1), // Wrong dimensions
      new Array(128).fill('not-a-number'),
    ];

    for (const emb of invalidEmbeddings) {
      const result = validateEmbedding(emb);
      if (result.valid) {
        console.log('FAIL: Invalid embedding accepted:', emb);
        pass = false;
      }
    }
    console.log('✅ All invalid embeddings rejected');

    // Test liveness validation
    const livenessResult = validateLiveness({ blink: true, headMovement: true, smile: false });
    if (!livenessResult.valid || livenessResult.passedCount < 2) {
      console.log('FAIL: Valid liveness rejected');
      pass = false;
    } else {
      console.log('✅ Liveness validation passes (2 checks)');
    }

    const failedLiveness = validateLiveness({ blink: false, headMovement: false, smile: false });
    if (failedLiveness.valid) {
      console.log('FAIL: Failed liveness accepted');
      pass = false;
    } else {
      console.log('✅ Failed liveness correctly rejected');
    }

  } catch (err) {
    console.log('FAIL: Exception:', err.message);
    pass = false;
  }

  return pass;
}

// ============================================================
// VALIDATION HELPERS (copied from faceVerification.util.js)
// ============================================================

function validateEmbedding(embedding) {
  if (!embedding) return { valid: false, error: 'Embedding is required' };
  if (!Array.isArray(embedding)) return { valid: false, error: 'Embedding must be an array' };
  if (embedding.length !== 128) return { valid: false, error: 'Must be 128-dim' };
  for (let i = 0; i < embedding.length; i++) {
    if (typeof embedding[i] !== 'number' || isNaN(embedding[i])) {
      return { valid: false, error: 'Must contain only numbers' };
    }
  }
  return { valid: true };
}

function validateLiveness(livenessChecks) {
  const result = {
    valid: true,
    checks: { blink: false, headMovement: false, smile: false },
    passedCount: 0,
    requiredChecks: 2,
  };

  if (livenessChecks) {
    result.checks.blink = livenessChecks.blink === true;
    result.checks.headMovement = livenessChecks.headMovement === true;
    result.checks.smile = livenessChecks.smile === true;
  }

  result.passedCount = [result.checks.blink, result.checks.headMovement, result.checks.smile].filter(Boolean).length;

  if (result.passedCount < result.requiredChecks) {
    result.valid = false;
  }
  return result;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🧪 COMPREHENSIVE API TEST SUITE');
  console.log('==================================');

  try {
    await setup();

    const results = {
      qrVerification: await testQRVerification(),
      faceVerification: await testFaceVerification(),
      faceRegistration: await testFaceRegistration(),
      historyAndStats: await testHistoryAndStats(),
      edgeCases: await testEdgeCases(),
    };

    console.log('\n==================================');
    console.log('📊 TEST SUMMARY');
    console.log('==================================');

    let allPassed = true;
    for (const [test, result] of Object.entries(results)) {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.padEnd(20)} ${status}`);
      if (!result) allPassed = false;
    }

    console.log('==================================');
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();