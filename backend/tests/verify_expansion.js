import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sarkarisetu.gov.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@SarkariSetu2026';

async function request(url, options = {}, body = null) {
  const reqOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };
  if (body) {
    reqOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, reqOptions);
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { status: res.status, data: json };
}

async function runExpansionVerification() {
  console.log('================================================================');
  console.log('SARKARISETU SCHEME EXPANSION VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  // 1. Verify Category Scheme Counts (All 14 categories >= 5)
  console.log('--- 1. Category Counts Check ---');
  const catRes = await request(`${API_BASE}/categories`);
  const categories = catRes.data?.data || [];
  assert(
    catRes.status === 200 && categories.length === 14,
    'All 14 categories present',
    `Found ${categories.length} categories`
  );
  const allAtLeast5 = categories.every((c) => c.count >= 5);
  assert(
    allAtLeast5,
    'Every category contains at least 5 schemes',
    categories.map((c) => `${c.name}: ${c.count}`).join(', ')
  );

  // 2. Search Keyword Tests
  console.log('\n--- 2. Keyword Search Verification ---');
  const keywords = [
    'farmer',
    'student',
    'health',
    'housing',
    'employment',
    'women',
    'agriculture',
    'skill',
    'senior citizen',
    'disability',
    'MSME',
  ];

  for (const kw of keywords) {
    const sRes = await request(`${API_BASE}/schemes?search=${encodeURIComponent(kw)}`);
    const count = sRes.data?.data?.length || 0;
    assert(
      sRes.status === 200 && count > 0,
      `Search keyword "${kw}" returns results`,
      `Found ${count} matching schemes`
    );
  }

  // 3. Multi-Dimension Filter Tests
  console.log('\n--- 3. Multi-Dimension Filter Verification ---');
  // Category filter
  const agriFilter = await request(`${API_BASE}/schemes?category=Agriculture`);
  assert(
    agriFilter.status === 200 && agriFilter.data?.count === 5,
    'Category filter "Agriculture" returns 5 schemes',
    `Count: ${agriFilter.data?.count}`
  );

  // State filter
  const mhFilter = await request(`${API_BASE}/schemes?state=Maharashtra`);
  assert(
    mhFilter.status === 200 && mhFilter.data?.count > 0,
    'State filter "Maharashtra" includes State + All India schemes',
    `Count: ${mhFilter.data?.count}`
  );

  // 4. Eligibility Engine Multi-Profile Testing
  console.log('\n--- 4. Eligibility Engine Multi-Profile Verification ---');
  const profiles = [
    {
      name: 'Farmer (Rural, Male, 42, Agriculture)',
      data: { age: 42, gender: 'Male', state: 'Maharashtra', occupation: 'Farmer', farmerStatus: true, annualIncome: 120000, ruralOrUrban: 'Rural', category: 'General' },
      expectedTopKeyword: 'Kisan',
    },
    {
      name: 'Student (Urban, Female, 20, Higher Education)',
      data: { age: 20, gender: 'Female', state: 'Delhi', occupation: 'Student', studentStatus: true, annualIncome: 200000, ruralOrUrban: 'Urban', category: 'General' },
      expectedTopKeyword: 'Scholarship',
    },
    {
      name: 'Senior Citizen (Rural, Male, 68, Retired)',
      data: { age: 68, gender: 'Male', state: 'Uttar Pradesh', occupation: 'Retired / Senior', annualIncome: 80000, ruralOrUrban: 'Rural', category: 'OBC' },
      expectedTopKeyword: 'Pension',
    },
    {
      name: 'Woman Entrepreneur (Urban, Female, 32, Business)',
      data: { age: 32, gender: 'Female', state: 'Karnataka', occupation: 'Self-Employed / Business', annualIncome: 400000, ruralOrUrban: 'Urban', category: 'General' },
      expectedTopKeyword: 'Women',
    },
    {
      name: 'Person with Disability (Divyangjan, 28, Unemployed)',
      data: { age: 28, gender: 'Male', state: 'Tamil Nadu', occupation: 'Unemployed', disabilityStatus: true, annualIncome: 100000, ruralOrUrban: 'Rural', category: 'SC' },
      expectedTopKeyword: 'Disab',
    },
    {
      name: 'Low-Income Daily Wage Worker (Urban, 35)',
      data: { age: 35, gender: 'Male', state: 'Delhi', occupation: 'Daily Wage Worker', annualIncome: 90000, ruralOrUrban: 'Urban', category: 'General' },
      expectedTopKeyword: 'Awas',
    },
  ];

  for (const prof of profiles) {
    const elRes = await request(`${API_BASE}/eligibility/check`, { method: 'POST' }, prof.data);
    const results = elRes.data?.data || [];
    const topMatch = results[0];
    assert(
      elRes.status === 200 && results.length > 0 && topMatch.matchPercentage >= 75,
      `Eligibility evaluation for ${prof.name}`,
      `Top match: "${topMatch.schemeName}" with ${topMatch.matchPercentage}% (${topMatch.status})`
    );
  }

  // 5. Admin Panel Stats & Analytics Verification
  console.log('\n--- 5. Admin Stats & Analytics Verification ---');
  const loginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const adminToken = loginRes.data?.data?.token;

  const adminStats = await request(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const totalSchemes = adminStats.data?.data?.totalSchemes;
  assert(
    adminStats.status === 200 && totalSchemes >= 70,
    `Admin stats reflect expanded database`,
    `totalSchemes: ${totalSchemes}, activeSchemes: ${adminStats.data?.data?.activeSchemes}`
  );

  const adminAnalytics = await request(`${API_BASE}/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const byCategory = adminAnalytics.data?.data?.schemesByCategory || [];
  assert(
    adminAnalytics.status === 200 && byCategory.length === 14,
    'Admin analytics category aggregation has all 14 categories',
    `Aggregated ${byCategory.length} categories from MongoDB`
  );

  console.log('\n================================================================');
  console.log('EXPANSION VERIFICATION SUMMARY');
  console.log('================================================================');
  console.log(`Total tests executed : ${passed + failed}`);
  console.log(`Passed tests count   : ${passed}`);
  console.log(`Failed tests count   : ${failed}`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('>>> ALL EXPANSION VERIFICATION TESTS PASSED! <<<');
    process.exit(0);
  } else {
    console.error(`>>> ${failed} TEST(S) FAILED. <<<`);
    process.exit(1);
  }
}

runExpansionVerification();
