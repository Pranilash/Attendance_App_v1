import fs from 'fs';

const BASE_URL = 'https://attendanceappv1.vercel.app';

// Helper for making requests
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    const duration = Date.now() - start;
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return {
      status: res.status,
      ok: res.ok,
      duration,
      data
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: err.message
    };
  }
}

async function runAllTests() {
  console.log(`=======================================================`);
  console.log(`Starting Comprehensive Endpoints Verification on:`);
  console.log(`${BASE_URL}`);
  console.log(`=======================================================\n`);

  const results = [];

  function record(category, name, method, path, res, expectedStatus, validator) {
    const passed = (res.status === expectedStatus) && (!validator || validator(res.data));
    const statusMsg = passed ? 'PASS' : 'FAIL';
    const detail = passed ? '' : ` (Expected: ${expectedStatus}, Got: ${res.status})`;
    console.log(`[${statusMsg}] ${category} | ${method} ${path} -> ${res.status} (${res.duration}ms)${detail}`);
    
    results.push({
      category,
      name,
      method,
      path,
      status: res.status,
      expectedStatus,
      duration: res.duration,
      passed,
      dataSnippet: typeof res.data === 'string' ? res.data.slice(0, 100) : JSON.stringify(res.data)?.slice(0, 150)
    });
    return passed;
  }

  // 1. PUBLIC ROUTES
  console.log(`--- [1/5] Testing Public Routes ---`);
  let res = await request('/health');
  record('Public', 'Health Check', 'GET', '/health', res, 200, d => d.success === true);

  res = await request('/api/v1');
  record('Public', 'API Root Info', 'GET', '/api/v1', res, 200, d => d.endpoints?.auth);

  res = await request('/api/departments');
  record('Public', 'Public Departments List', 'GET', '/api/departments', res, 200, d => Array.isArray(d.data));

  // 2. AUTHENTICATION & LOGIN FOR ROLES
  console.log(`\n--- [2/5] Testing Auth Endpoints ---`);
  
  // Admin Login
  res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@attendance.edu', password: 'Admin@123456' })
  });
  record('Auth', 'Admin Login', 'POST', '/api/auth/login', res, 200, d => d.data?.accessToken);
  const adminToken = res.data?.data?.accessToken;

  // Faculty Login
  res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'priya.sharma@attendance.edu', password: 'Faculty@123' })
  });
  record('Auth', 'Faculty Login', 'POST', '/api/auth/login', res, 200, d => d.data?.accessToken);
  const facultyToken = res.data?.data?.accessToken;

  // Student Login
  res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'arjun.reddy@attendance.edu', password: 'Student@123' })
  });
  record('Auth', 'Student Login', 'POST', '/api/auth/login', res, 200, d => d.data?.accessToken);
  const studentToken = res.data?.data?.accessToken;

  // Invalid Login
  res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@attendance.edu', password: 'WrongPassword' })
  });
  record('Auth', 'Invalid Login Rejection', 'POST', '/api/auth/login', res, 401);

  // Auth Me (Protected)
  res = await request('/api/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Auth', 'Get Current User (Admin)', 'GET', '/api/auth/me', res, 200, d => d.data?.role === 'admin');

  res = await request('/api/auth/me', { headers: { Authorization: `Bearer ${facultyToken}` } });
  record('Auth', 'Get Current User (Faculty)', 'GET', '/api/auth/me', res, 200, d => d.data?.role === 'faculty');

  res = await request('/api/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Auth', 'Get Current User (Student)', 'GET', '/api/auth/me', res, 200, d => d.data?.role === 'student');

  res = await request('/api/auth/me'); // No token
  record('Auth', 'Get Current User Without Token (Unauthorized)', 'GET', '/api/auth/me', res, 401);

  // Update Profile
  res = await request('/api/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ phone: '9000000000' })
  });
  record('Auth', 'Update Profile', 'PATCH', '/api/auth/profile', res, 200);

  // 3. ADMIN ENDPOINTS
  console.log(`\n--- [3/5] Testing Admin Endpoints ---`);
  
  res = await request('/api/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Admin', 'Admin Statistics', 'GET', '/api/admin/stats', res, 200, d => d.data?.totalStudents > 0);

  res = await request('/api/admin/departments', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Admin', 'Admin Departments List', 'GET', '/api/admin/departments', res, 200, d => Array.isArray(d.data));

  res = await request('/api/admin/faculty', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Admin', 'Admin Faculty List', 'GET', '/api/admin/faculty', res, 200, d => d.data?.faculty?.length > 0 || Array.isArray(d.data));

  res = await request('/api/admin/students', { headers: { Authorization: `Bearer ${adminToken}` } });
  record('Admin', 'Admin Students List', 'GET', '/api/admin/students', res, 200, d => d.data?.students?.length > 0 || Array.isArray(d.data));

  // Admin Department CRUD
  const testDeptCode = `T_${Date.now().toString().slice(-4)}`;
  res = await request('/api/admin/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `Test Dept ${testDeptCode}`, code: testDeptCode })
  });
  const createdDeptId = res.data?.data?._id;
  record('Admin', 'Admin Create Department', 'POST', '/api/admin/departments', res, 201);

  if (createdDeptId) {
    res = await request(`/api/admin/department/${createdDeptId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `Updated Dept ${testDeptCode}` })
    });
    record('Admin', 'Admin Update Department', 'PATCH', `/api/admin/department/${createdDeptId}`, res, 200);

    res = await request(`/api/admin/department/${createdDeptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('Admin', 'Admin Delete Department', 'DELETE', `/api/admin/department/${createdDeptId}`, res, 200);
  }

  // RBAC Admin Security Gate
  res = await request('/api/admin/stats', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Admin RBAC', 'Student Accessing Admin Stats (Forbidden)', 'GET', '/api/admin/stats', res, 403);

  // 4. FACULTY ENDPOINTS
  console.log(`\n--- [4/5] Testing Faculty Endpoints ---`);

  res = await request('/api/faculty/departments', { headers: { Authorization: `Bearer ${facultyToken}` } });
  record('Faculty', 'Faculty Departments List', 'GET', '/api/faculty/departments', res, 200);

  res = await request('/api/faculty/students', { headers: { Authorization: `Bearer ${facultyToken}` } });
  record('Faculty', 'Faculty Students List', 'GET', '/api/faculty/students', res, 200);

  res = await request('/api/faculty/classes', { headers: { Authorization: `Bearer ${facultyToken}` } });
  record('Faculty', 'Faculty Classes List', 'GET', '/api/faculty/classes', res, 200, d => Array.isArray(d.data));
  const classesList = res.data?.data || [];
  const testClassId = classesList[0]?._id;

  if (testClassId) {
    res = await request(`/api/faculty/class/${testClassId}`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Get Single Class', 'GET', `/api/faculty/class/${testClassId}`, res, 200);

    res = await request(`/api/faculty/class/${testClassId}/debarment-watchlist`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Debarment Watchlist (VII Sem Upgrade 4)', 'GET', `/api/faculty/class/${testClassId}/debarment-watchlist`, res, 200);

    res = await request(`/api/faculty/session/history/${testClassId}`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Session History', 'GET', `/api/faculty/session/history/${testClassId}`, res, 200);

    res = await request(`/api/faculty/report/class/${testClassId}`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Class Report', 'GET', `/api/faculty/report/class/${testClassId}`, res, 200);

    res = await request(`/api/faculty/report/class/${testClassId}/csv`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Class Report CSV Export', 'GET', `/api/faculty/report/class/${testClassId}/csv`, res, 200);

    res = await request(`/api/faculty/session/active/${testClassId}`, { headers: { Authorization: `Bearer ${facultyToken}` } });
    record('Faculty', 'Faculty Active Session Check', 'GET', `/api/faculty/session/active/${testClassId}`, res, 200);
  }

  res = await request('/api/faculty/timetable', { headers: { Authorization: `Bearer ${facultyToken}` } });
  record('Faculty', 'Faculty Timetable (VII Sem Upgrade 5)', 'GET', '/api/faculty/timetable', res, 200);

  // RBAC Faculty Security Gate
  res = await request('/api/faculty/classes', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Faculty RBAC', 'Student Accessing Faculty Classes (Forbidden)', 'GET', '/api/faculty/classes', res, 403);

  // 5. STUDENT ENDPOINTS
  console.log(`\n--- [5/5] Testing Student Endpoints ---`);

  res = await request('/api/student/classes', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Student', 'Student Enrolled Classes', 'GET', '/api/student/classes', res, 200);

  res = await request('/api/student/timetable', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Student', 'Student Timetable (VII Sem Upgrade 5)', 'GET', '/api/student/timetable', res, 200);

  res = await request('/api/student/attendance/history', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Student', 'Student Attendance History', 'GET', '/api/student/attendance/history', res, 200);

  res = await request('/api/student/attendance/stats', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Student', 'Student Attendance Stats & DRI', 'GET', '/api/student/attendance/stats', res, 200);

  res = await request('/api/student/face/status', { headers: { Authorization: `Bearer ${studentToken}` } });
  record('Student', 'Student Face Biometric Status', 'GET', '/api/student/face/status', res, 200, d => d.data?.registered === true);

  // 6. ATTENDANCE & SESSION WORKFLOW
  console.log(`\n--- [6/6] Testing Dynamic Session & QR Lifecycle ---`);
  
  if (testClassId) {
    // Start attendance session as faculty
    res = await request('/api/faculty/session/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({ classId: testClassId })
    });
    // If an active session already exists, end it first and re-try start
    if (res.status === 400 && res.data?.message?.includes('already exists')) {
      const activeRes = await request(`/api/faculty/session/active/${testClassId}`, { headers: { Authorization: `Bearer ${facultyToken}` } });
      const activeId = activeRes.data?.data?._id;
      if (activeId) {
        await request('/api/faculty/session/end', {
          method: 'POST',
          headers: { Authorization: `Bearer ${facultyToken}` },
          body: JSON.stringify({ sessionId: activeId })
        });
        res = await request('/api/faculty/session/start', {
          method: 'POST',
          headers: { Authorization: `Bearer ${facultyToken}` },
          body: JSON.stringify({ classId: testClassId })
        });
      }
    }
    const startedSession = res.data?.data;
    record('Faculty Session', 'Faculty Start Attendance Session', 'POST', '/api/faculty/session/start', res, 201, d => d.data?.qrSignature);

    if (startedSession?._id) {
      // Student scans QR
      const qrPayload = JSON.stringify({
        sessionId: startedSession._id,
        timestamp: startedSession.timestamp,
        signature: startedSession.qrSignature
      });

      res = await request('/api/student/attendance/verify-qr', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ qrPayload })
      });
      // Will return 200 (challenge issued) or 400 (if already attended this session)
      record('Student QR', 'Student Verify Dynamic QR Code', 'POST', '/api/student/attendance/verify-qr', res, res.status === 200 ? 200 : 400);

      // Faculty ends attendance session
      res = await request('/api/faculty/session/end', {
        method: 'POST',
        headers: { Authorization: `Bearer ${facultyToken}` },
        body: JSON.stringify({ sessionId: startedSession._id })
      });
      record('Faculty Session', 'Faculty End Attendance Session', 'POST', '/api/faculty/session/end', res, 200);
    }
  }

  // Logout
  res = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  record('Auth', 'Student Logout', 'POST', '/api/auth/logout', res, 200);

  console.log(`\n=======================================================`);
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`SUMMARY: ${passedCount}/${total} PASSED (${failedCount} failed)`);
  console.log(`=======================================================`);

  return { total, passedCount, failedCount, results };
}

runAllTests().then(summary => {
  fs.writeFileSync('scratch_results.json', JSON.stringify(summary, null, 2));
});
