const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/auth';

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res;
}

async function testRefreshTokenNotInJSON() {
  console.log('\n=== Test 1: Refresh token NOT in JSON response ===');
  const res = await loginUser('admin@attendance.edu', 'Admin@123456');
  const body = await res.json();
  const hasRefreshToken = body.data && body.data.hasOwnProperty('refreshToken');
  if (hasRefreshToken) {
    console.error('FAIL: refreshToken is still in JSON response!');
    console.dir(body.data, { depth: null });
    return false;
  }
  console.log('PASS: refreshToken is NOT in JSON response (safe in httpOnly cookie)');
  console.log('Response data keys:', Object.keys(body.data || {}));
  return true;
}

async function testCookieSetCorrectly() {
  console.log('\n=== Test 1b: Verify cookies are set ===');
  const res = await loginUser('admin@attendance.edu', 'Admin@123456');
  const cookies = res.headers.raw()['set-cookie'];
  if (!cookies || cookies.length < 2) {
    console.error('FAIL: Expected at least 2 cookies (accessToken, refreshToken)');
    console.log('Cookies:', cookies);
    return false;
  }
  const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
  const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
  if (!accessTokenCookie || !refreshTokenCookie) {
    console.error('FAIL: Missing accessToken or refreshToken cookie');
    console.log('All cookies:', cookies);
    return false;
  }
  const accessHttpOnly = accessTokenCookie.includes('HttpOnly');
  const refreshHttpOnly = refreshTokenCookie.includes('HttpOnly');
  if (!accessHttpOnly || !refreshHttpOnly) {
    console.error('FAIL: Tokens not HttpOnly');
    return false;
  }
  console.log('PASS: Both cookies are set and HttpOnly');
  console.log('  accessToken cookie:', accessTokenCookie.substring(0, 60) + '...');
  console.log('  refreshToken cookie:', refreshTokenCookie.substring(0, 60) + '...');
  return true;
}

async function runAll() {
  let results = [];
  results.push(await testRefreshTokenNotInJSON());
  results.push(await testCookieSetCorrectly());
  const passed = results.filter(r => r === true).length;
  console.log(`\n=== Summary: ${passed}/${results.length} tests passed ===`);
  return passed === results.length;
}

runAll().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test harness error:', err);
  process.exit(1);
});
