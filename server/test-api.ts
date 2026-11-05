import axios from 'axios';

async function testApi() {
  console.log('--- Verifying Backend REST API ---');

  // 1. Health check
  const health = await axios.get('http://localhost:5001/api/health');
  console.log('✅ Health Check:', health.data);

  // 2. Demo student login
  const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
    loginId: 'demo@attendwise.edu',
    password: 'Demo@123',
  });
  console.log('✅ Demo Login Successful! Student:', loginRes.data.user.name);
  const token = loginRes.data.token;

  // 3. Get Subjects & Overall Metrics
  const subjectsRes = await axios.get('http://localhost:5001/api/subjects', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✅ Fetched Subjects Count:', subjectsRes.data.subjects.length);
  console.log('✅ Overall Attendance:', subjectsRes.data.overall.percentage, '%');
  console.log('✅ Overall Leave Margin:', subjectsRes.data.overall.margin, 'classes');
  console.log('✅ Overall Required Classes:', subjectsRes.data.overall.requiredClasses);

  // 4. Test Calculator Simulation
  const simRes = await axios.post('http://localhost:5001/api/calculator/simulate', {
    totalClasses: 40,
    attendedClasses: 32,
    futureMissed: 3,
    futureAttended: 0,
    targetPercentage: 75,
  });
  console.log('✅ Simulation Result:', simRes.data.simulation.projectedPercentage, '% (Will meet target:', simRes.data.simulation.willMeetTarget, ')');

  // 5. Test SRM Captcha Retrieval
  const captchaRes = await axios.get('http://localhost:5001/api/portal/srm/captcha', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✅ SRM Captcha Session:', captchaRes.data.sessionId ? 'Acquired' : 'Failed');
  console.log('✅ Captcha Data URL length:', captchaRes.data.captchaDataUrl.length);

  // 6. Test Quick Log
  const firstSub = subjectsRes.data.subjects[0];
  const quickLogRes = await axios.post(
    `http://localhost:5001/api/subjects/${firstSub.id}/quick-log`,
    { status: 'PRESENT' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ Quick-Log Recorded:', quickLogRes.data.message);

  console.log('\n🚀 ALL BACKEND REST APIS ARE VERIFIED AND WORKING!');
}

testApi().catch((err) => {
  console.error('❌ API Verification Failed:', err.response?.data || err.message);
  process.exit(1);
});

