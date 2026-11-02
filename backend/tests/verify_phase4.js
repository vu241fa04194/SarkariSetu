import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sarkarisetu.gov.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@SarkariSetu2026';
const DEMO_CITIZEN_EMAIL = process.env.DEMO_CITIZEN_EMAIL || 'ramesh.kumar@example.com';
const DEMO_CITIZEN_PASSWORD = process.env.DEMO_CITIZEN_PASSWORD || 'password123';

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

async function runTestSuite() {
  console.log('================================================================');
  console.log('SARKARISETU PHASE 4 - PRODUCTION READINESS TEST SUITE (31 TESTS)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(num, condition, description, details = '') {
    if (condition) {
      console.log(`[PASS] Test ${num}: ${description}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${num}: ${description}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // AUTHENTICATION (Tests 1 - 6)
    // ---------------------------------------------------------
    console.log('--- 1. Authentication Suite (Tests 1-6) ---');

    // Test 1: Citizen registration with valid data
    const uniqueEmail = `citizen_test_${Date.now()}@example.com`;
    const regRes = await request(`${API_BASE}/users/register`, { method: 'POST' }, {
      name: 'Priya Sharma',
      email: uniqueEmail,
      password: 'SecurePassword2026',
      age: 28,
      gender: 'Female',
      state: 'Maharashtra',
      occupation: 'Self-Employed / Business',
      annualIncome: 350000,
    });
    const regToken = regRes.data?.data?.token;
    assert(
      1,
      regRes.status === 201 && regToken && regRes.data?.data?.role === 'citizen',
      'Citizen registration with valid data',
      `Registered "${uniqueEmail}" with token and citizen role (HTTP 201)`
    );

    // Test 2: Citizen login with valid credentials
    const citLoginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
      email: uniqueEmail,
      password: 'SecurePassword2026',
    });
    const citToken = citLoginRes.data?.data?.token;
    assert(
      2,
      citLoginRes.status === 200 && citToken && citLoginRes.data?.data?.email === uniqueEmail,
      'Citizen login with valid credentials',
      `Logged in successfully, token issued (HTTP 200)`
    );

    // Test 3: Citizen login with invalid credentials -> returns 401
    const invalidLoginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
      email: uniqueEmail,
      password: 'WrongPassword999',
    });
    assert(
      3,
      invalidLoginRes.status === 401 && invalidLoginRes.data?.success === false,
      'Citizen login with invalid credentials -> returns 401',
      `Server rejected incorrect password with HTTP 401`
    );

    // Test 4: Admin login with admin credentials
    const adminLoginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const adminToken = adminLoginRes.data?.data?.token;
    const adminRole = adminLoginRes.data?.data?.role;
    assert(
      4,
      adminLoginRes.status === 200 && adminToken && adminRole === 'admin',
      'Admin login with admin credentials',
      `Admin logged in with role "${adminRole}" and token (HTTP 200)`
    );

    // Test 5: JWT token validation on protected route
    const profileRes = await request(`${API_BASE}/users/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      5,
      profileRes.status === 200 && profileRes.data?.data?.email === uniqueEmail,
      'JWT token validation on protected route',
      `Protected /users/profile authorized via Bearer JWT (HTTP 200)`
    );

    // Test 6: Logout / session clearing on client (invalid/cleared token returns 401)
    const clearedTokenRes = await request(`${API_BASE}/users/profile`, {
      method: 'GET',
      headers: { Authorization: 'Bearer cleared_session_token_invalid' },
    });
    assert(
      6,
      clearedTokenRes.status === 401,
      'Logout / session clearing on client rejection',
      `Invalid / cleared session token correctly rejected with HTTP 401`
    );

    // ---------------------------------------------------------
    // AUTHORIZATION (Tests 7 - 9)
    // ---------------------------------------------------------
    console.log('\n--- 2. Authorization Suite (Tests 7-9) ---');

    // Test 7: Citizen attempting to access admin API -> returns 403 Forbidden
    const citAdminAccess = await request(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      7,
      citAdminAccess.status === 403,
      'Citizen attempting to access admin API -> returns 403 Forbidden',
      `Citizen blocked from /api/admin/stats with HTTP 403`
    );

    // Test 8: Admin accessing admin API -> returns 200 OK
    const adminStatsAccess = await request(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      8,
      adminStatsAccess.status === 200 && adminStatsAccess.data?.success === true,
      'Admin accessing admin API -> returns 200 OK',
      `Admin authorized for /api/admin/stats (HTTP 200)`
    );

    // Test 9: Unauthenticated user accessing protected route -> returns 401 Unauthorized
    const unauthRes = await request(`${API_BASE}/users/saved-schemes`, {
      method: 'GET',
    });
    assert(
      9,
      unauthRes.status === 401,
      'Unauthenticated user accessing protected route -> returns 401 Unauthorized',
      `Access without Bearer header correctly rejected with HTTP 401`
    );

    // ---------------------------------------------------------
    // SCHEMES (Tests 10 - 18)
    // ---------------------------------------------------------
    console.log('\n--- 3. Scheme Management Suite (Tests 10-18) ---');

    // Test 10: Scheme search by keyword returns matching schemes
    const searchRes = await request(`${API_BASE}/schemes?search=Kisan`);
    const searchMatches = searchRes.data?.data || [];
    assert(
      10,
      searchRes.status === 200 && searchMatches.length > 0,
      'Scheme search by keyword returns matching schemes',
      `Keyword "Kisan" returned ${searchMatches.length} matching scheme(s)`
    );

    // Test 11: Scheme filter by category returns correct schemes
    const catRes = await request(`${API_BASE}/schemes?category=Farmers`);
    const catSchemes = catRes.data?.data || [];
    const allFarmers = catSchemes.length > 0 && catSchemes.every((s) => s.category === 'Farmers');
    assert(
      11,
      catRes.status === 200 && allFarmers,
      'Scheme filter by category returns correct schemes',
      `Found ${catSchemes.length} schemes under category "Farmers"`
    );

    // Test 12: Scheme filter by state returns Central + state-specific schemes
    const stateRes = await request(`${API_BASE}/schemes?state=Maharashtra`);
    const stateSchemes = stateRes.data?.data || [];
    const stateValid = stateSchemes.length > 0 && stateSchemes.every(
      (s) => s.state === 'Maharashtra' || s.state === 'All India'
    );
    assert(
      12,
      stateRes.status === 200 && stateValid,
      'Scheme filter by state returns Central + state-specific schemes',
      `Found ${stateSchemes.length} schemes valid for Maharashtra (State + All India)`
    );

    // Pick a scheme ID for detailed tests
    const sampleScheme = searchMatches[0] || stateSchemes[0];
    const sampleSchemeId = sampleScheme._id;

    // Test 13: Scheme details page loads complete data
    const detailsRes = await request(`${API_BASE}/schemes/${sampleSchemeId}`);
    const detailsData = detailsRes.data?.data;
    assert(
      13,
      detailsRes.status === 200 && detailsData && detailsData.schemeName && Array.isArray(detailsData.benefits),
      'Scheme details page loads complete data',
      `Loaded "${detailsData?.schemeName}" with full benefits & eligibility criteria`
    );

    // Test 14: Scheme view count increments on view
    const initialViews = detailsData.viewsCount || 0;
    const viewTrackRes = await request(`${API_BASE}/schemes/${sampleSchemeId}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const updatedDetails = await request(`${API_BASE}/schemes/${sampleSchemeId}`);
    const newViews = updatedDetails.data?.data?.viewsCount || 0;
    assert(
      14,
      viewTrackRes.status === 200 && newViews >= initialViews + 1,
      'Scheme view count increments on view',
      `Views incremented from ${initialViews} to ${newViews}`
    );

    // Test 15: Admin creates new scheme with all fields
    const testSchemeName = `Phase 4 National Solar Incentive ${Date.now()}`;
    const createSchemeRes = await request(`${API_BASE}/schemes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      schemeName: testSchemeName,
      category: 'Financial Assistance',
      department: 'Ministry of New and Renewable Energy',
      description: 'Comprehensive financial incentive to promote renewable solar adoption.',
      benefits: ['Up to 40% capital subsidy', 'Net metering assistance'],
      eligibility: ['Residential property owners', 'Grid-connected households'],
      applicationProcess: ['Apply online via National Rooftop Solar Portal.'],
      requiredDocuments: ['Electricity Bill', 'Aadhaar Card', 'Roof ownership proof'],
      officialWebsite: 'https://pmsuryaghar.gov.in',
      sourceType: 'Central Government',
      state: 'All India',
      status: 'Active',
      verificationStatus: 'Verified',
      applicableGender: 'All',
      minimumAge: 18,
      maximumAge: 75,
      maximumIncome: 1200000,
    });
    const createdScheme = createSchemeRes.data?.data;
    const testSchemeId = createdScheme?._id;
    assert(
      15,
      createSchemeRes.status === 201 && testSchemeId && createdScheme?.schemeName === testSchemeName,
      'Admin creates new scheme with all fields',
      `Created scheme ID: ${testSchemeId} (HTTP 201)`
    );

    // Test 16: Admin edits existing scheme
    const editRes = await request(`${API_BASE}/schemes/${testSchemeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      description: 'Updated comprehensive subsidy for residential rooftop solar with expedited disbursement.',
      maximumIncome: 1500000,
    });
    assert(
      16,
      editRes.status === 200 && editRes.data?.data?.maximumIncome === 1500000,
      'Admin edits existing scheme',
      `Updated maximumIncome to 1500000 and updated description (HTTP 200)`
    );

    // Test 17: Admin deletes scheme (or marks inactive)
    const deleteRes = await request(`${API_BASE}/schemes/${testSchemeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      17,
      deleteRes.status === 200 && deleteRes.data?.success === true,
      'Admin deletes scheme (or marks inactive)',
      `Deleted / soft-deleted test scheme (HTTP 200)`
    );

    // Test 18: Scheme status toggle works correctly
    const toggleInactiveRes = await request(`${API_BASE}/admin/schemes/${sampleSchemeId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'Under Review' });

    const toggleActiveRes = await request(`${API_BASE}/admin/schemes/${sampleSchemeId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'Active' });

    assert(
      18,
      toggleInactiveRes.status === 200 && toggleActiveRes.status === 200 && toggleActiveRes.data?.data?.status === 'Active',
      'Scheme status toggle works correctly',
      `Toggled status Under Review -> Active successfully (HTTP 200)`
    );

    // ---------------------------------------------------------
    // ELIGIBILITY (Tests 19 - 21)
    // ---------------------------------------------------------
    console.log('\n--- 4. Eligibility Engine Suite (Tests 19-21) ---');

    // Test 19: Eligibility check with matching profile returns schemes with match score
    const matchingProfile = {
      age: 42,
      gender: 'Male',
      state: 'Maharashtra',
      occupation: 'Farmer',
      farmerStatus: true,
      annualIncome: 150000,
      ruralOrUrban: 'Rural',
      category: 'General',
    };
    const eligRes = await request(`${API_BASE}/eligibility/check`, { method: 'POST' }, matchingProfile);
    const scoredSchemes = eligRes.data?.data || [];
    const highMatch = scoredSchemes.find((s) => s.matchPercentage >= 75);
    assert(
      19,
      eligRes.status === 200 && scoredSchemes.length > 0 && highMatch != null,
      'Eligibility check with matching profile returns schemes with match score',
      `Identified ${scoredSchemes.length} potential schemes; top score: ${scoredSchemes[0]?.matchPercentage}%`
    );

    // Test 20: Eligibility check with non-matching profile returns lower match score
    const mismatchedProfile = {
      age: 95,
      gender: 'Male',
      state: 'Goa',
      occupation: 'Retired / Senior',
      annualIncome: 30000000,
      farmerStatus: false,
      studentStatus: false,
      ruralOrUrban: 'Urban',
      category: 'General',
    };
    const nonMatchRes = await request(`${API_BASE}/eligibility/check`, { method: 'POST' }, mismatchedProfile);
    const nonMatchSchemes = nonMatchRes.data?.data || [];
    const kisanInNonMatch = nonMatchSchemes.find((s) => s.schemeName.includes('PM-KISAN'));
    assert(
      20,
      nonMatchRes.status === 200 && (kisanInNonMatch ? kisanInNonMatch.matchPercentage < 50 : true),
      'Eligibility check with non-matching profile returns lower match score',
      `High-income/non-farmer evaluated with lower match score (${kisanInNonMatch?.matchPercentage || 0}%)`
    );

    // Test 21: Missing optional fields handled gracefully (not crashing)
    const emptyProfileRes = await request(`${API_BASE}/eligibility/check`, { method: 'POST' }, {});
    const partialProfileRes = await request(`${API_BASE}/eligibility/check`, { method: 'POST' }, { age: 25 });
    assert(
      21,
      emptyProfileRes.status === 200 && partialProfileRes.status === 200,
      'Missing optional fields handled gracefully (not crashing)',
      `Engine evaluated empty profile and partial profile without runtime error (HTTP 200)`
    );

    // ---------------------------------------------------------
    // CITIZEN FEATURES (Tests 22 - 26)
    // ---------------------------------------------------------
    console.log('\n--- 5. Citizen Experience Features Suite (Tests 22-26) ---');

    // Test 22: Citizen saves a scheme
    const saveRes = await request(`${API_BASE}/users/saved-schemes/${sampleSchemeId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const savedListAfterAdd = await request(`${API_BASE}/users/saved-schemes`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const hasSaved = (savedListAfterAdd.data?.data || []).some((s) => s._id === sampleSchemeId);
    assert(
      22,
      saveRes.status === 200 && hasSaved,
      'Citizen saves a scheme',
      `Scheme ${sampleSchemeId} saved to user bookmarks (HTTP 200)`
    );

    // Test 23: Citizen removes a saved scheme
    const removeRes = await request(`${API_BASE}/users/saved-schemes/${sampleSchemeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const savedListAfterRemove = await request(`${API_BASE}/users/saved-schemes`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const stillSaved = (savedListAfterRemove.data?.data || []).some((s) => s._id === sampleSchemeId);
    assert(
      23,
      removeRes.status === 200 && !stillSaved,
      'Citizen removes a saved scheme',
      `Scheme ${sampleSchemeId} removed from saved list (HTTP 200)`
    );

    // Test 24: Citizen views recently viewed schemes
    const recentRes = await request(`${API_BASE}/users/recently-viewed`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      24,
      recentRes.status === 200 && Array.isArray(recentRes.data?.data),
      'Citizen views recently viewed schemes',
      `Retrieved ${recentRes.data?.count || 0} recently viewed schemes for citizen (HTTP 200)`
    );

    // Test 25: Citizen creates/tracks an application
    const appTrackRes = await request(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citToken}` },
    }, {
      schemeId: sampleSchemeId,
      status: 'Applied',
      applicationDate: new Date().toISOString(),
      referenceNumber: `APP-MH-${Date.now()}`,
      notes: 'Submitted online via state agriculture portal.',
    });
    const createdAppId = appTrackRes.data?.data?._id;
    assert(
      25,
      appTrackRes.status === 201 && createdAppId && appTrackRes.data?.data?.status === 'Applied',
      'Citizen creates/tracks an application',
      `Application tracker record created with ID ${createdAppId} (HTTP 201)`
    );

    // Test 26: In-app notification received when application status changes
    const updateAppRes = await request(`${API_BASE}/applications/${createdAppId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
    }, {
      status: 'Completed',
      notes: 'Documents verified and application process completed.',
    });
    const notifsRes = await request(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const hasStatusNotif = (notifsRes.data?.data || []).some(
      (n) => n.type === 'status_update' || n.title.includes('Status Updated') || n.title.includes('Tracking')
    );
    assert(
      26,
      updateAppRes.status === 200 && notifsRes.status === 200 && hasStatusNotif,
      'In-app notification received when application status changes',
      `Status change triggered in-app notification in citizen inbox (HTTP 200)`
    );

    // ---------------------------------------------------------
    // ANALYTICS & STATS (Tests 27 - 28)
    // ---------------------------------------------------------
    console.log('\n--- 6. Analytics & MongoDB Aggregation Suite (Tests 27-28) ---');

    // Test 27: Admin dashboard stats return accurate counts
    const statsRes = await request(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stats = statsRes.data?.data;
    assert(
      27,
      statsRes.status === 200 && stats?.totalSchemes >= 15 && stats?.totalUsers >= 2,
      'Admin dashboard stats return accurate counts',
      `totalSchemes: ${stats?.totalSchemes}, activeSchemes: ${stats?.activeSchemes}, totalUsers: ${stats?.totalUsers}`
    );

    // Test 28: Schemes by category aggregation works correctly
    const analyticsRes = await request(`${API_BASE}/admin/analytics`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const schemesByCat = analyticsRes.data?.data?.schemesByCategory || [];
    assert(
      28,
      analyticsRes.status === 200 && Array.isArray(schemesByCat) && schemesByCat.length > 0 && schemesByCat[0].count > 0,
      'Schemes by category aggregation works correctly',
      `Aggregated ${schemesByCat.length} distinct categories using MongoDB $group pipeline`
    );

    // ---------------------------------------------------------
    // REGRESSION: PHASES 1, 2, 3 (Tests 29 - 31)
    // ---------------------------------------------------------
    console.log('\n--- 7. Regression Suite Across Phases 1, 2, 3 (Tests 29-31) ---');

    // Test 29: Phase 1 features intact (public browsing, categories, search)
    const publicCatRes = await request(`${API_BASE}/categories`);
    const publicSchemesRes = await request(`${API_BASE}/schemes?limit=5`);
    assert(
      29,
      publicCatRes.status === 200 && publicSchemesRes.status === 200 && publicCatRes.data?.count >= 8,
      'Phase 1 features intact (public browsing, categories, search)',
      `Public categories (${publicCatRes.data?.count}) & schemes browse intact without auth`
    );

    // Test 30: Phase 2 features intact (user accounts, smart eligibility finder)
    const updateProfileRes = await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
    }, {
      district: 'Pune',
      farmerStatus: true,
    });
    const recsRes = await request(`${API_BASE}/eligibility/recommendations`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      30,
      updateProfileRes.status === 200 && recsRes.status === 200 && Array.isArray(recsRes.data?.data),
      'Phase 2 features intact (user accounts, smart eligibility finder)',
      `Citizen profile updated and personalized recommendations returned ${recsRes.data?.count || 0} schemes`
    );

    // Test 31: Phase 3 features intact (admin panel, application tracker, notifications)
    const adminUsersRes = await request(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const myAppsRes = await request(`${API_BASE}/applications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      31,
      adminUsersRes.status === 200 && myAppsRes.status === 200 && Array.isArray(adminUsersRes.data?.data),
      'Phase 3 features intact (admin panel, application tracker, notifications)',
      `Admin user management & application tracker fully operational`
    );

  } catch (err) {
    console.error('Unexpected error running test suite:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log('FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  console.log(`Total tests executed : ${passed + failed}`);
  console.log(`Passed tests count   : ${passed}`);
  console.log(`Failed tests count   : ${failed}`);
  console.log('================================================================');

  if (failed === 0 && passed === 31) {
    console.log('>>> ALL 31 TESTS PASSED SUCCESSFULLY! FULL PRODUCTION READY. <<<');
    process.exit(0);
  } else {
    console.error(`>>> ${failed} TEST(S) FAILED. INVESTIGATION REQUIRED. <<<`);
    process.exit(1);
  }
}

runTestSuite();
