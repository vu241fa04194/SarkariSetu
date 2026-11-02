const API_BASE = 'http://localhost:5000/api';

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

async function runTests() {
  console.log('====================================================');
  console.log('SARKARISETU PHASE 3 - 16 SCENARIO VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // SCENARIO 1: Citizen login
    console.log('\n--- Scenario 1: Citizen Login ---');
    const citizenLoginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
      email: 'ramesh.kumar@example.com',
      password: 'password123',
    });
    const citizenUser = citizenLoginRes.data?.data;
    const citizenToken = citizenUser?.token;
    assert(
      citizenLoginRes.status === 200 && citizenToken && citizenUser?.role === 'citizen',
      `Citizen login successful with role "${citizenUser?.role}"`
    );

    // SCENARIO 2: Admin login
    console.log('\n--- Scenario 2: Admin Login ---');
    const adminLoginRes = await request(`${API_BASE}/users/login`, { method: 'POST' }, {
      email: 'admin@sarkarisetu.gov.in',
      password: 'Admin@SarkariSetu2026',
    });
    const adminUser = adminLoginRes.data?.data;
    const adminToken = adminUser?.token;
    assert(
      adminLoginRes.status === 200 && adminToken && adminUser?.role === 'admin',
      `Admin login successful with role "${adminUser?.role}"`
    );

    // SCENARIO 3: Citizen blocked from admin APIs (403)
    console.log('\n--- Scenario 3: Citizen Blocked from Admin APIs ---');
    const citizenBlockedStats = await request(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(citizenBlockedStats.status === 403, `Citizen blocked from /admin/stats (HTTP ${citizenBlockedStats.status})`);

    const citizenBlockedUsers = await request(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(citizenBlockedUsers.status === 403, `Citizen blocked from /admin/users (HTTP ${citizenBlockedUsers.status})`);

    const citizenBlockedCreateScheme = await request(`${API_BASE}/schemes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    }, { schemeName: 'Unauthorized Citizen Scheme', category: 'Education', department: 'Test', description: 'Test' });
    assert(citizenBlockedCreateScheme.status === 403, `Citizen blocked from scheme creation API (HTTP ${citizenBlockedCreateScheme.status})`);

    // SCENARIO 4: Admin permitted on admin APIs (200)
    console.log('\n--- Scenario 4: Admin Access to Admin APIs ---');
    const adminStats = await request(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStats.status === 200 && adminStats.data.success, 'Admin successfully accesses /admin/stats');
    console.log(`   Total Schemes: ${adminStats.data.data.totalSchemes}, Active: ${adminStats.data.data.activeSchemes}, Total Users: ${adminStats.data.data.totalUsers}`);

    const adminUsers = await request(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.data), 'Admin successfully accesses /admin/users');

    // SCENARIO 5: Admin creates scheme
    console.log('\n--- Scenario 5: Admin Creates Scheme ---');
    const newSchemePayload = {
      schemeName: 'Phase 3 Verification Test Grant',
      category: 'Education',
      department: 'Ministry of Education',
      state: 'All India',
      description: 'A test scheme for Phase 3 verification.',
      benefits: ['Scholarship of Rs. 10,000 per semester'],
      eligibility: ['Enrolled in recognized institution'],
      minimumAge: 16,
      maximumAge: 25,
      occupations: ['Student'],
      maximumIncome: 500000,
      applicableGender: 'All',
      eligibleStates: ['All India'],
      requiredDocuments: ['College ID card', 'Income certificate'],
      applicationProcess: ['Apply online at the official portal'],
      officialWebsite: 'https://scholarships.gov.in',
      sourceName: 'National Scholarship Portal',
      sourceURL: 'https://scholarships.gov.in',
      sourceType: 'Central Government',
      status: 'Active',
      verificationStatus: 'Pending Verification',
    };

    const createSchemeRes = await request(`${API_BASE}/schemes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, newSchemePayload);
    assert(createSchemeRes.status === 201 && createSchemeRes.data.success, 'Admin creates scheme (HTTP 201)');
    const createdSchemeId = createSchemeRes.data?.data?._id;

    // SCENARIO 6: Admin edits scheme
    console.log('\n--- Scenario 6: Admin Edits Scheme ---');
    const updateSchemeRes = await request(`${API_BASE}/schemes/${createdSchemeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      schemeName: 'Phase 3 Verification Test Grant (Updated)',
      description: 'Updated description for Phase 3 testing.',
    });
    assert(
      updateSchemeRes.status === 200 && updateSchemeRes.data.data.schemeName.includes('(Updated)'),
      'Admin edits scheme title and description successfully'
    );

    // SCENARIO 7: Admin updates verification status
    console.log('\n--- Scenario 7: Admin Updates Verification Status ---');
    const verifRes = await request(`${API_BASE}/admin/schemes/${createdSchemeId}/verification`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { verificationStatus: 'Verified' });
    assert(
      verifRes.status === 200 && verifRes.data.data.verificationStatus === 'Verified',
      `Admin updates verification status to "Verified" (verifiedAt: ${verifRes.data?.data?.verifiedAt})`
    );

    // SCENARIO 8: Admin deactivates scheme
    console.log('\n--- Scenario 8: Admin Deactivates Scheme ---');
    const deactRes = await request(`${API_BASE}/admin/schemes/${createdSchemeId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, { status: 'Inactive' });
    assert(
      deactRes.status === 200 && deactRes.data.data.status === 'Inactive',
      'Admin toggles scheme status to "Inactive"'
    );

    // SCENARIO 9: Citizen sees only active schemes
    console.log('\n--- Scenario 9: Citizen Sees Only Active Schemes ---');
    const citizenSchemesRes = await request(`${API_BASE}/schemes`);
    const isInactiveVisibleToCitizen = citizenSchemesRes.data.data.some(s => s._id === createdSchemeId);
    assert(
      !isInactiveVisibleToCitizen,
      'Inactive scheme is excluded from public citizen /schemes query'
    );

    // Clean up created scheme
    await request(`${API_BASE}/schemes/${createdSchemeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // SCENARIO 10: Scheme view tracking
    console.log('\n--- Scenario 10: Scheme View Tracking ---');
    const sampleScheme = citizenSchemesRes.data.data[0];
    const initialViews = sampleScheme.viewsCount || 0;
    const viewRes = await request(`${API_BASE}/schemes/${sampleScheme._id}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      viewRes.status === 200 && viewRes.data.viewsCount === initialViews + 1,
      `View counter increments atomically from ${initialViews} to ${viewRes.data?.viewsCount}`
    );

    // SCENARIO 11: Citizen application tracker CRUD
    console.log('\n--- Scenario 11: Citizen Application Tracker CRUD ---');
    const createTrackingRes = await request(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    }, {
      schemeId: sampleScheme._id,
      status: 'Interested',
      notes: 'Initial evaluation via SarkariSetu',
    });
    assert(createTrackingRes.status === 201, 'Citizen creates application tracker record (HTTP 201)');
    const trackingId = createTrackingRes.data?.data?._id;

    const listTrackingRes = await request(`${API_BASE}/applications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const foundTracking = listTrackingRes.data?.data?.find(a => a._id === trackingId);
    assert(!!foundTracking, 'Citizen reads application tracking records (GET /applications)');

    const updateTrackingRes = await request(`${API_BASE}/applications/${trackingId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citizenToken}` },
    }, {
      status: 'Applied',
      referenceNumber: 'TEST/APP/2026/001',
      notes: 'Documents submitted at CSC',
    });
    assert(
      updateTrackingRes.status === 200 && updateTrackingRes.data.data.status === 'Applied',
      'Citizen updates application tracking record to "Applied"'
    );

    const deleteTrackingRes = await request(`${API_BASE}/applications/${trackingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(deleteTrackingRes.status === 200, 'Citizen deletes application tracking record');

    // SCENARIO 12: Citizen notifications and mark-as-read
    console.log('\n--- Scenario 12: Citizen Notifications & Mark As Read ---');
    const notifsRes = await request(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(notifsRes.status === 200 && Array.isArray(notifsRes.data.data), 'Citizen fetches internal notifications');

    if (notifsRes.data.data.length > 0) {
      const firstNotif = notifsRes.data.data[0];
      const readOneRes = await request(`${API_BASE}/notifications/${firstNotif._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assert(readOneRes.status === 200 && readOneRes.data.data.read === true, 'Citizen marks single notification as read');
    }

    const readAllRes = await request(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(readAllRes.status === 200 && readAllRes.data.success, 'Citizen marks all notifications as read');

    // SCENARIO 13: Recommendations system works with active schemes
    console.log('\n--- Scenario 13: Profile-Based Recommendations ---');
    const recsRes = await request(`${API_BASE}/eligibility/recommendations`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      recsRes.status === 200 && Array.isArray(recsRes.data.data),
      `Recommendation engine generates ${recsRes.data?.data?.length} matched schemes (profile completion: ${recsRes.data?.profileCompletion}%)`
    );

    // SCENARIO 14: Real MongoDB aggregation analytics
    console.log('\n--- Scenario 14: Real MongoDB Aggregation Analytics ---');
    const analyticsRes = await request(`${API_BASE}/admin/analytics`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analytics = analyticsRes.data.data;
    assert(
      analyticsRes.status === 200 &&
      Array.isArray(analytics.schemesByCategory) &&
      Array.isArray(analytics.schemesByState) &&
      Array.isArray(analytics.verificationStatusCounts) &&
      Array.isArray(analytics.mostViewedSchemes),
      `Analytics aggregation pipelines executed (Categories: ${analytics?.schemesByCategory?.length}, States: ${analytics?.schemesByState?.length})`
    );

    // SCENARIO 15: Phase 1 intact (listing, search, category, details)
    console.log('\n--- Scenario 15: Phase 1 Functionality Intact ---');
    const searchRes = await request(`${API_BASE}/schemes?search=kisan`);
    assert(
      searchRes.status === 200 && searchRes.data.data.length > 0,
      `Phase 1 search works (found ${searchRes.data.data.length} results for 'kisan')`
    );

    const catRes = await request(`${API_BASE}/categories`);
    assert(
      catRes.status === 200 && catRes.data.data.length >= 8,
      `Phase 1 categories works (${catRes.data.data.length} categories available)`
    );

    const filterRes = await request(`${API_BASE}/schemes?category=Agriculture`);
    assert(
      filterRes.status === 200 && filterRes.data.data.every(s => s.category === 'Agriculture'),
      'Phase 1 category filtering works accurately'
    );

    // SCENARIO 16: Phase 2 intact (profile, eligibility check, saved schemes)
    console.log('\n--- Scenario 16: Phase 2 Functionality Intact ---');
    const profileRes = await request(`${API_BASE}/users/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      profileRes.status === 200 && profileRes.data.data.name === 'Ramesh Kumar',
      'Phase 2 citizen profile retrieval works'
    );

    const eligCheckRes = await request(`${API_BASE}/eligibility/check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    }, {
      profile: profileRes.data.data,
      schemeId: sampleScheme._id,
    });
    assert(
      eligCheckRes.status === 200 && typeof eligCheckRes.data.data.matchPercentage === 'number',
      `Phase 2 eligibility check returns ${eligCheckRes.data?.data?.matchPercentage}% match`
    );

    const bookmarkRes = await request(`${API_BASE}/users/saved-schemes/${sampleScheme._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(
      bookmarkRes.status === 200 && bookmarkRes.data.success,
      'Phase 2 scheme bookmark toggle works'
    );

    console.log('\n====================================================');
    console.log(`ALL TESTS COMPLETED: Passed: ${passed}, Failed: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runTests();
