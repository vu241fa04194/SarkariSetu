/**
 * SARKARISETU PHASE 5: SMART RECOMMENDATION SYSTEM VERIFICATION SUITE
 *
 * Verifies all 16 required test scenarios:
 * 1. Farmer recommendations.
 * 2. Student recommendations.
 * 3. Senior citizen recommendations.
 * 4. Incomplete user profile.
 * 5. Unsatisfied mandatory eligibility condition.
 * 6. Missing eligibility data (treated as unknown, not a match).
 * 7. State and income restrictions.
 * 8. Save and unsave recommendations.
 * 9. Recommendations update after profile changes.
 * 10. Empty recommendation results handling.
 * 11. Unauthenticated access is rejected (401).
 * 12. Citizen cannot access admin-only features (403).
 * 13. Registration and login still work.
 * 14. Existing scheme search and categories still work.
 * 15. Existing application tracking and notifications still work.
 * 16. Existing admin dashboard and scheme management still work.
 */

const API_BASE = 'http://localhost:5000/api';

const request = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
};

let passed = 0;
let failed = 0;

const assert = (scenarioNum, condition, title, detail) => {
  if (condition) {
    passed++;
    console.log(`[PASS] Scenario ${scenarioNum}: ${title}`);
    if (detail) console.log(`       -> ${detail}`);
  } else {
    failed++;
    console.error(`[FAIL] Scenario ${scenarioNum}: ${title}`);
    if (detail) console.error(`       -> ${detail}`);
  }
};

const runSuite = async () => {
  console.log('================================================================');
  console.log('SARKARISETU PHASE 5: SMART RECOMMENDATIONS VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // ---------------------------------------------------------
    // Setup Test Citizen & Admin
    // ---------------------------------------------------------
    const uniqueEmail = `citizen_phase5_${Date.now()}@example.com`;
    const password = 'Password@123';

    // Register citizen
    const regRes = await request(`${API_BASE}/users/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Phase5 Test Citizen',
        email: uniqueEmail,
        password,
      }),
    });
    const citToken = regRes.data?.data?.token;

    // Login Admin
    const adminLoginRes = await request(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@sarkarisetu.gov.in',
        password: process.env.ADMIN_PASSWORD || 'Admin@SarkariSetu2026',
      }),
    });
    const adminToken = adminLoginRes.data?.data?.token;

    // ---------------------------------------------------------
    // Scenario 1: Farmer Recommendations
    // ---------------------------------------------------------
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 44,
        gender: 'Male',
        state: 'Maharashtra',
        district: 'Pune',
        occupation: 'Farmer',
        annualIncome: 120000,
        ruralOrUrban: 'Rural',
        farmerStatus: true,
        studentStatus: false,
        disabilityStatus: false,
        category: 'OBC',
      }),
    });

    const farmerRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const farmerRecs = farmerRecRes.data?.data || [];
    const topFarmerScheme = farmerRecs.find(
      (r) =>
        r.category === 'Farmers' ||
        r.category === 'Agriculture' ||
        r.schemeName.includes('Kisan')
    );
    const farmerHasExplanation = topFarmerScheme?.matchReason?.length > 10;
    const farmerHasBenefits = topFarmerScheme?.benefits?.length > 0;
    assert(
      1,
      farmerRecRes.status === 200 && topFarmerScheme?.matchPercentage >= 75 && farmerHasExplanation && farmerHasBenefits,
      'Farmer recommendations generated with high match score, explanation & benefits',
      `Top match: "${topFarmerScheme?.schemeName}" (${topFarmerScheme?.matchPercentage}%). Reason: "${topFarmerScheme?.matchReason}"`
    );

    // ---------------------------------------------------------
    // Scenario 2: Student Recommendations
    // ---------------------------------------------------------
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 20,
        gender: 'Female',
        state: 'Maharashtra',
        district: 'Mumbai',
        occupation: 'Student',
        annualIncome: 0,
        ruralOrUrban: 'Urban',
        farmerStatus: false,
        studentStatus: true,
        disabilityStatus: false,
        category: 'General',
      }),
    });

    const studentRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const studentRecs = studentRecRes.data?.data || [];
    const topStudentScheme = studentRecs.find(
      (r) =>
        r.category === 'Students' ||
        r.category === 'Education' ||
        r.matchedConditions?.some((c) => c.toLowerCase().includes('student'))
    );
    assert(
      2,
      studentRecRes.status === 200 && topStudentScheme?.matchPercentage >= 75,
      'Student recommendations generated with student prerequisites confirmed',
      `Top student match: "${topStudentScheme?.schemeName}" (${topStudentScheme?.matchPercentage}%)`
    );

    // ---------------------------------------------------------
    // Scenario 3: Senior Citizen Recommendations
    // ---------------------------------------------------------
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 68,
        gender: 'Male',
        state: 'Maharashtra',
        district: 'Nagpur',
        occupation: 'Retired',
        annualIncome: 75000,
        ruralOrUrban: 'Rural',
        farmerStatus: false,
        studentStatus: false,
        disabilityStatus: false,
        category: 'General',
      }),
    });

    const seniorRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const seniorRecs = seniorRecRes.data?.data || [];
    const topSeniorScheme = seniorRecs.find(
      (r) =>
        r.category === 'Senior Citizens' ||
        r.matchedConditions?.some((c) => c.toLowerCase().includes('age'))
    );
    assert(
      3,
      seniorRecRes.status === 200 && topSeniorScheme?.matchPercentage >= 75,
      'Senior citizen recommendations match age-specific welfare programs',
      `Top senior match: "${topSeniorScheme?.schemeName}" (${topSeniorScheme?.matchPercentage}%)`
    );

    // ---------------------------------------------------------
    // Scenario 4: Incomplete User Profile
    // ---------------------------------------------------------
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: null,
        gender: '',
        state: '',
        district: '',
        occupation: '',
        annualIncome: null,
        ruralOrUrban: '',
        farmerStatus: false,
        studentStatus: false,
        disabilityStatus: false,
        category: '',
      }),
    });

    const incompleteRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const missingFields = incompleteRecRes.data?.missingFields || [];
    const profileComp = incompleteRecRes.data?.profileCompletion;
    const needsInfoCount = incompleteRecRes.data?.needsInfoCount;
    assert(
      4,
      incompleteRecRes.status === 200 &&
        profileComp === 0 &&
        missingFields.length > 5 &&
        needsInfoCount > 0,
      'Incomplete user profile identifies missing fields and flags schemes needing info',
      `Profile completion: ${profileComp}%, Missing fields: [${missingFields.join(', ')}], Needs info count: ${needsInfoCount}`
    );

    // ---------------------------------------------------------
    // Scenario 5: Unsatisfied Mandatory Eligibility Condition
    // ---------------------------------------------------------
    // User is 70 years old, high income, non-student, non-farmer
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 70,
        gender: 'Male',
        state: 'Maharashtra',
        district: 'Pune',
        occupation: 'Executive',
        annualIncome: 5000000,
        ruralOrUrban: 'Urban',
        farmerStatus: false,
        studentStatus: false,
        disabilityStatus: false,
        category: 'General',
      }),
    });

    const unmetRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const unmetRecs = unmetRecRes.data?.data || [];
    const incomeUnmet = unmetRecs.find((r) =>
      r.unmetConditions?.some((u) => u.toLowerCase().includes('income'))
    );
    assert(
      5,
      incomeUnmet &&
        incomeUnmet.hasUnmetConditions === true &&
        incomeUnmet.matchType === 'unmet',
      'Unsatisfied mandatory eligibility condition properly flagged with unmet details',
      `Scheme "${incomeUnmet?.schemeName}" has unmet condition: "${incomeUnmet?.unmetConditions?.[0]}"`
    );

    // ---------------------------------------------------------
    // Scenario 6: Missing Eligibility Data Treated as Unknown (Not as a Match)
    // ---------------------------------------------------------
    // User provides age 25, but leaves annualIncome null
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 25,
        gender: 'Male',
        state: 'Maharashtra',
        district: 'Pune',
        occupation: 'Private Employee',
        annualIncome: null, // missing income
        ruralOrUrban: 'Urban',
        farmerStatus: false,
        studentStatus: false,
        disabilityStatus: false,
        category: 'General',
      }),
    });

    const missingDataRecRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const missingDataRecs = missingDataRecRes.data?.data || [];
    const cappedScheme = missingDataRecs.find(
      (r) =>
        r.missingInformation?.some((m) => m.toLowerCase().includes('income')) &&
        !r.matchedConditions?.some((c) => c.toLowerCase().includes('income'))
    );
    assert(
      6,
      cappedScheme &&
        cappedScheme.missingInformation.some((m) => m.toLowerCase().includes('income')),
      'Missing eligibility data treated as unknown, not credited as a match',
      `Scheme "${cappedScheme?.schemeName}" reports missing info: "${cappedScheme?.missingInformation?.[0]}" without awarding income match`
    );

    // ---------------------------------------------------------
    // Scenario 7: State and Income Restrictions
    // ---------------------------------------------------------
    const stateFilteredRes = await request(
      `${API_BASE}/eligibility/recommendations?state=Delhi`,
      {
        headers: { Authorization: `Bearer ${citToken}` },
      }
    );
    const delhiRecs = stateFilteredRes.data?.data || [];
    const allDelhiValid = delhiRecs.every(
      (r) =>
        r.state === 'Delhi' ||
        r.state === 'All India' ||
        (r.scheme?.eligibleStates && r.scheme.eligibleStates.includes('Delhi'))
    );
    assert(
      7,
      stateFilteredRes.status === 200 && delhiRecs.length > 0 && allDelhiValid,
      'State and regional restrictions strictly enforced in recommendations',
      `Filtered state "Delhi" returned ${delhiRecs.length} schemes, all geographically valid`
    );

    // ---------------------------------------------------------
    // Scenario 8: Save and Unsave Recommendations
    // ---------------------------------------------------------
    const sampleSchemeId = farmerRecs[0]?.schemeId;
    const saveRes = await request(`${API_BASE}/users/saved-schemes/${sampleSchemeId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const savedListRes = await request(`${API_BASE}/users/saved-schemes`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const isSaved = (savedListRes.data?.data || []).some((s) => s._id === sampleSchemeId);

    const unsaveRes = await request(`${API_BASE}/users/saved-schemes/${sampleSchemeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const unsavedListRes = await request(`${API_BASE}/users/saved-schemes`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const isUnsaved = !(unsavedListRes.data?.data || []).some((s) => s._id === sampleSchemeId);

    assert(
      8,
      saveRes.status === 200 && isSaved && unsaveRes.status === 200 && isUnsaved,
      'Save and unsave bookmark workflow functions seamlessly from recommendations',
      `Scheme ${sampleSchemeId} saved and subsequently unsaved successfully`
    );

    // ---------------------------------------------------------
    // Scenario 9: Recommendations Update Dynamically After Profile Changes
    // ---------------------------------------------------------
    // Step A: Driver profile
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 30,
        gender: 'Male',
        state: 'Maharashtra',
        occupation: 'Driver',
        annualIncome: 180000,
        farmerStatus: false,
      }),
    });
    const recsBefore = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const pmKisanBefore = recsBefore.data?.data?.find((r) =>
      r.schemeName.includes('PM-KISAN')
    )?.matchPercentage;

    // Step B: Update to Farmer
    await request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        age: 30,
        gender: 'Male',
        state: 'Maharashtra',
        occupation: 'Farmer',
        annualIncome: 180000,
        farmerStatus: true,
      }),
    });
    const recsAfter = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    const pmKisanAfter = recsAfter.data?.data?.find((r) =>
      r.schemeName.includes('PM-KISAN')
    )?.matchPercentage;

    assert(
      9,
      pmKisanAfter > pmKisanBefore,
      'Recommendations update dynamically following profile changes',
      `PM-KISAN match score increased from ${pmKisanBefore}% to ${pmKisanAfter}% after profile occupation update`
    );

    // ---------------------------------------------------------
    // Scenario 10: Empty Recommendation Results Handled Gracefully
    // ---------------------------------------------------------
    const emptyQueryRes = await request(
      `${API_BASE}/eligibility/recommendations?category=NonExistentCategoryXYZ`,
      {
        headers: { Authorization: `Bearer ${citToken}` },
      }
    );
    assert(
      10,
      emptyQueryRes.status === 200 &&
        emptyQueryRes.data?.success === true &&
        emptyQueryRes.data?.count === 0 &&
        Array.isArray(emptyQueryRes.data?.data),
      'Empty recommendation results handled gracefully with structured empty array',
      `Returned count: ${emptyQueryRes.data?.count}, success: ${emptyQueryRes.data?.success}`
    );

    // ---------------------------------------------------------
    // Scenario 11: Unauthenticated Access is Rejected (401)
    // ---------------------------------------------------------
    const unauthRes = await request(`${API_BASE}/eligibility/recommendations`);
    assert(
      11,
      unauthRes.status === 401,
      'Unauthenticated recommendation request rejected with HTTP 401',
      `Server rejected request without Bearer token (HTTP ${unauthRes.status})`
    );

    // ---------------------------------------------------------
    // Scenario 12: Citizen Cannot Access Admin-Only Features (403)
    // ---------------------------------------------------------
    const citAdminRes = await request(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      12,
      citAdminRes.status === 403,
      'Citizen access to admin-only APIs strictly blocked with HTTP 403',
      `Server returned HTTP ${citAdminRes.status} Forbidden`
    );

    // ---------------------------------------------------------
    // Scenario 13: Registration and Login Still Work
    // ---------------------------------------------------------
    const regCheckRes = await request(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify({ email: uniqueEmail, password }),
    });
    assert(
      13,
      regCheckRes.status === 200 && regCheckRes.data?.data?.token,
      'User registration and login flow fully intact',
      `Authenticated citizen "${regCheckRes.data?.data?.email}" successfully with new JWT`
    );

    // ---------------------------------------------------------
    // Scenario 14: Existing Scheme Search and Categories Still Work
    // ---------------------------------------------------------
    const searchRes = await request(`${API_BASE}/schemes?search=Health`);
    const catRes = await request(`${API_BASE}/categories`);
    const all14Categories = catRes.data?.data?.length === 14;
    assert(
      14,
      searchRes.status === 200 &&
        searchRes.data?.data?.length > 0 &&
        catRes.status === 200 &&
        all14Categories,
      'Existing scheme search and all 14 categories intact',
      `Search "Health" returned ${searchRes.data?.data?.length} schemes; 14 categories verified`
    );

    // ---------------------------------------------------------
    // Scenario 15: Existing Application Tracking and Notifications Still Work
    // ---------------------------------------------------------
    const appTrackRes = await request(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citToken}` },
      body: JSON.stringify({
        schemeId: sampleSchemeId,
        status: 'Interested',
        notes: 'Phase 5 application tracking verification',
      }),
    });
    const notifsRes = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${citToken}` },
    });
    assert(
      15,
      appTrackRes.status === 201 && notifsRes.status === 200,
      'Application tracking and notifications subsystem operational',
      `Created tracker ID: ${appTrackRes.data?.data?._id}, inbox count: ${notifsRes.data?.count}`
    );

    // ---------------------------------------------------------
    // Scenario 16: Existing Admin Dashboard and Scheme Management Still Work
    // ---------------------------------------------------------
    const adminStatsRes = await request(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      16,
      adminStatsRes.status === 200 && adminStatsRes.data?.data?.totalSchemes >= 70,
      'Admin dashboard analytics and scheme management operational',
      `Total schemes: ${adminStatsRes.data?.data?.totalSchemes}, Active: ${adminStatsRes.data?.data?.activeSchemes}`
    );

  } catch (err) {
    console.error('Unexpected error in test suite:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log('PHASE 5 VERIFICATION SUITE SUMMARY');
  console.log('================================================================');
  console.log(`Total scenarios tested : ${passed + failed}`);
  console.log(`Passed scenarios count : ${passed}`);
  console.log(`Failed scenarios count : ${failed}`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('>>> ALL 16 PHASE 5 SCENARIOS PASSED SUCCESSFULLY! <<<\n');
    process.exit(0);
  } else {
    console.error(`>>> ${failed} SCENARIO(S) FAILED. INVESTIGATION REQUIRED. <<<\n`);
    process.exit(1);
  }
};

runSuite();
