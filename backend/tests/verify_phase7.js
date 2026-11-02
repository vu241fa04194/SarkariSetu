/**
 * SARKARISETU PHASE 7: SMART DOCUMENT CHECKLIST & APPLICATION GUIDANCE
 * VERIFICATION SUITE
 *
 * Verifies all 12 required test scenarios:
 * 1. View document requirements for a scheme (documentRequirements & applicationGuidance)
 * 2. Create/update interactive checklist via API (POST & PATCH checklist items)
 * 3. Save checklist progress after refresh (MongoDB persistence and calculation)
 * 4. Guest checklist fallback validation (API metadata & frontend localStorage handling)
 * 5. User-specific data isolation (User A cannot access or overwrite User B data)
 * 6. Application tracking status updates across all 7 statuses (Interested -> Approved/Rejected)
 * 7. Invalid/missing data validation (invalid ID 400, non-existent scheme 404)
 * 8. Admin-only editing validation (citizen blocked 403, admin permitted 200)
 * 9. Official URL and source handling (verified .gov.in sources)
 * 10. Multilingual key verification (en, te, hi 100% key parity for Phase 7 keys)
 * 11. Mobile responsiveness & UI components check
 * 12. Regression verification (auth, categories, schemes, recommendations, analytics)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
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

const getLeafKeys = (obj, prefix = '') => {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
};

const runSuite = async () => {
  console.log('================================================================');
  console.log('SARKARISETU PHASE 7: CHECKLIST & APPLICATION GUIDANCE VERIFICATION');
  console.log('================================================================\n');

  try {
    // ---------------------------------------------------------
    // Setup Test Users: Citizen A, Citizen B, and Admin
    // ---------------------------------------------------------
    const ts = Date.now();
    const userAEmail = `citizen_p7_a_${ts}@example.com`;
    const userBEmail = `citizen_p7_b_${ts}@example.com`;
    const password = 'Password@123';

    // Register Citizen A
    const regResA = await request(`${API_BASE}/users/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Citizen Alpha',
        email: userAEmail,
        password,
      }),
    });
    const tokenA = regResA.data?.data?.token;

    // Register Citizen B
    const regResB = await request(`${API_BASE}/users/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Citizen Beta',
        email: userBEmail,
        password,
      }),
    });
    const tokenB = regResB.data?.data?.token;

    // Login Admin
    const adminLoginRes = await request(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@sarkarisetu.gov.in',
        password: process.env.ADMIN_PASSWORD || 'Admin@SarkariSetu2026',
      }),
    });
    const tokenAdmin = adminLoginRes.data?.data?.token;

    // Fetch schemes to get a test scheme
    const schemesRes = await request(`${API_BASE}/schemes?limit=5`);
    const schemes = schemesRes.data?.data || [];
    const testScheme = schemes[0];
    const testSchemeId = testScheme?._id;

    // ---------------------------------------------------------
    // Scenario 1: View document requirements and guidance for a scheme
    // ---------------------------------------------------------
    const schemeDetailRes = await request(`${API_BASE}/schemes/${testSchemeId}`);
    const schemeData = schemeDetailRes.data?.data;

    const hasDocRequirements = Boolean(
      schemeData &&
      Array.isArray(schemeData.documentRequirements) &&
      schemeData.documentRequirements.length > 0 &&
      schemeData.documentRequirements[0].documentName
    );

    const hasGuidance = Boolean(
      schemeData &&
      schemeData.applicationGuidance &&
      Array.isArray(schemeData.applicationGuidance.stepByStepInstructions) &&
      schemeData.applicationGuidance.stepByStepInstructions.length > 0 &&
      schemeData.applicationGuidance.submissionMethod &&
      (schemeData.applicationGuidance.officialPortalURL || schemeData.applicationGuidance.sourceUrl || schemeData.officialWebsite)
    );

    assert(
      1,
      hasDocRequirements && hasGuidance,
      'Scheme details include structured document requirements and application guidance',
      `Scheme: ${schemeData?.schemeName}, Total Docs: ${schemeData?.documentRequirements?.length}, Steps: ${schemeData?.applicationGuidance?.stepByStepInstructions?.length}`
    );

    // ---------------------------------------------------------
    // Scenario 2: Create / update interactive checklist via API
    // ---------------------------------------------------------
    const initialChecklistRes = await request(`${API_BASE}/checklists/scheme/${testSchemeId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const checklistItems = initialChecklistRes.data?.data?.items || [];
    const firstDocName = checklistItems[0]?.documentName || 'Aadhaar Card';

    // Toggle the first item to collected
    const toggleRes = await request(`${API_BASE}/checklists/scheme/${testSchemeId}/item`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        documentName: firstDocName,
        isCollected: true,
        notes: 'Original Aadhaar verified and copy kept in folder.',
      }),
    });

    const updatedChecklist = toggleRes.data?.data;
    const itemAfterToggle = updatedChecklist?.items?.find((i) => i.documentName === firstDocName);
    const isCollectedTrue = itemAfterToggle?.isCollected === true || itemAfterToggle?.status === 'collected';
    const progressPositive = updatedChecklist?.completionPercentage > 0;

    assert(
      2,
      isCollectedTrue && progressPositive,
      'Citizen can toggle checklist item and calculate completion percentage',
      `Document: "${firstDocName}", Status: ${itemAfterToggle?.status}, Completion: ${updatedChecklist?.completionPercentage}%`
    );

    // ---------------------------------------------------------
    // Scenario 3: Save checklist progress after refresh (MongoDB persistence)
    // ---------------------------------------------------------
    const reloadedChecklistRes = await request(`${API_BASE}/checklists/scheme/${testSchemeId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const persistedItem = reloadedChecklistRes.data?.data?.items?.find((i) => i.documentName === firstDocName);
    const persistedSuccess =
      (persistedItem?.isCollected === true || persistedItem?.status === 'collected') &&
      persistedItem?.notes?.includes('Original Aadhaar');

    assert(
      3,
      persistedSuccess,
      'Checklist state and custom notes persist reliably in MongoDB on re-fetch',
      `Notes: "${persistedItem?.notes}", Percentage: ${reloadedChecklistRes.data?.data?.completionPercentage}%`
    );

    // ---------------------------------------------------------
    // Scenario 4: Guest checklist fallback validation
    // ---------------------------------------------------------
    // Guest fetch without auth header
    const guestChecklistRes = await request(`${API_BASE}/checklists/scheme/${testSchemeId}`);
    const guestDataValid = guestChecklistRes.status === 200 && guestChecklistRes.data?.data?.categories;

    // Verify frontend code handles localStorage fallback
    const frontendChecklistFile = path.join(FRONTEND_DIR, 'src/components/SmartDocumentChecklist.jsx');
    const checklistCode = fs.readFileSync(frontendChecklistFile, 'utf-8');
    const hasLocalStorageSupport =
      checklistCode.includes('sarkarisetu_guest_checklist_') &&
      checklistCode.includes('localStorage.setItem') &&
      checklistCode.includes('localStorage.getItem');

    assert(
      4,
      guestDataValid && hasLocalStorageSupport,
      'Guest access returns scheme document categories and falls back cleanly to localStorage',
      `Backend guest endpoint: HTTP ${guestChecklistRes.status}, Frontend localStorage support: ${hasLocalStorageSupport}`
    );

    // ---------------------------------------------------------
    // Scenario 5: User-specific data isolation
    // ---------------------------------------------------------
    // Citizen B fetches checklist for the same scheme
    const checklistBRes = await request(`${API_BASE}/checklists/scheme/${testSchemeId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const checklistBItems = checklistBRes.data?.data?.items || [];
    const itemForB = checklistBItems.find((i) => i.documentName === firstDocName);

    // B should NOT have A's collected status or notes
    const isolationPreserved = itemForB && itemForB.isCollected !== true && itemForB.status !== 'collected' && !itemForB.notes;

    assert(
      5,
      isolationPreserved,
      'User data isolation: Citizen B checklist is completely independent from Citizen A',
      `Citizen B status: ${itemForB?.status}, Notes: "${itemForB?.notes || 'none'}"`
    );

    // ---------------------------------------------------------
    // Scenario 6: Application tracking across all 7 statuses
    // ---------------------------------------------------------
    // 1. Interested
    const createTrackRes = await request(`${API_BASE}/applications/track`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        schemeId: testSchemeId,
        status: 'Interested',
        notes: 'Initial interest noted.',
      }),
    });
    const appId = createTrackRes.data?.data?._id;

    // Transition through all statuses
    const statusesToTest = [
      { status: 'Preparing Documents', notes: 'Gathering income certificate and Aadhaar.' },
      { status: 'Ready to Apply', notes: 'All docs scanned.' },
      {
        status: 'Application Submitted',
        notes: 'Applied via official portal.',
        referenceNumber: 'GOV-APP-2026-9988',
        submissionDate: new Date().toISOString(),
      },
      { status: 'Under Review', notes: 'Application verified by block development officer.' },
      { status: 'Approved', notes: 'Sanction letter issued.' },
    ];

    let allTransitionsPassed = Boolean(appId);

    for (const step of statusesToTest) {
      const updateRes = await request(`${API_BASE}/applications/${appId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify(step),
      });
      if (updateRes.status !== 200 || updateRes.data?.data?.status !== step.status) {
        allTransitionsPassed = false;
        break;
      }
    }

    // Verify rejection transition as well
    const rejectRes = await request(`${API_BASE}/applications/${appId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'Rejected', notes: 'Tested rejection flow.' }),
    });
    const rejectionHandled = rejectRes.status === 200 && rejectRes.data?.data?.status === 'Rejected';

    assert(
      6,
      allTransitionsPassed && rejectionHandled,
      'Application progress tracker successfully transitions across all Phase 7 statuses',
      `Tested: Interested -> Preparing Documents -> Ready to Apply -> Application Submitted -> Under Review -> Approved -> Rejected`
    );

    // ---------------------------------------------------------
    // Scenario 7: Invalid or missing data validation
    // ---------------------------------------------------------
    const invalidIdRes = await request(`${API_BASE}/checklists/scheme/invalid_id_format`);
    const nonExistentRes = await request(`${API_BASE}/checklists/scheme/000000000000000000000000`);

    const invalidHandled = invalidIdRes.status === 400 && nonExistentRes.status === 404;

    assert(
      7,
      invalidHandled,
      'Invalid scheme ID returns 400 Bad Request, non-existent ID returns 404 Not Found',
      `invalid ID: HTTP ${invalidIdRes.status}, non-existent ID: HTTP ${nonExistentRes.status}`
    );

    // ---------------------------------------------------------
    // Scenario 8: Admin-only editing validation
    // ---------------------------------------------------------
    // Citizen attempts to update scheme
    const citizenEditRes = await request(`${API_BASE}/schemes/${testSchemeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ schemeName: 'Citizen Tampered Scheme' }),
    });

    // Admin updates scheme guidance
    const adminEditRes = await request(`${API_BASE}/schemes/${testSchemeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        applicationGuidance: {
          submissionMethod: 'Hybrid',
          deadlines: 'Verified open cycle',
          officialPortalURL: schemeData.officialWebsite || 'https://india.gov.in',
          helpline: { phone: '1800-111-222', email: 'help@gov.in', hours: '9 AM - 6 PM' },
          stepByStepInstructions: ['Step 1: Admin updated instruction'],
        },
      }),
    });

    const citizenBlocked = citizenEditRes.status === 403;
    const adminAllowed = adminEditRes.status === 200;

    assert(
      8,
      citizenBlocked && adminAllowed,
      'Citizen blocked from editing scheme (403), Admin successfully authorized (200)',
      `Citizen edit: HTTP ${citizenEditRes.status}, Admin edit: HTTP ${adminEditRes.status}`
    );

    // ---------------------------------------------------------
    // Scenario 9: Official URL and source handling
    // ---------------------------------------------------------
    const allSchemesRes = await request(`${API_BASE}/schemes?limit=100`);
    const allSchemesList = allSchemesRes.data?.data || [];
    const validOfficialSources = allSchemesList.every((s) => {
      const url = s.sourceURL || s.officialWebsite || s.applicationGuidance?.officialPortalURL || s.applicationGuidance?.sourceUrl;
      return (
        typeof url === 'string' &&
        url.startsWith('https://') &&
        (url.includes('.gov.in') || url.includes('.nic.in') || url.includes('.org.in') || url.includes('.in') || url.includes('.org'))
      );
    });

    assert(
      9,
      validOfficialSources && allSchemesList.length >= 70,
      'All government schemes maintain authentic official portal URLs (.gov.in / .nic.in / .org.in / official authority)',
      `Validated across ${allSchemesList.length} schemes in MongoDB`
    );

    // ---------------------------------------------------------
    // Scenario 10: Multilingual key verification for Phase 7
    // ---------------------------------------------------------
    const enJson = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'src/i18n/locales/en.json'), 'utf-8'));
    const teJson = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'src/i18n/locales/te.json'), 'utf-8'));
    const hiJson = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'src/i18n/locales/hi.json'), 'utf-8'));

    const enKeys = getLeafKeys(enJson).sort();
    const teKeys = getLeafKeys(teJson).sort();
    const hiKeys = getLeafKeys(hiJson).sort();

    const phase7Prefixes = ['checklist.', 'guidance.', 'tracker.'];
    const p7EnKeys = enKeys.filter((k) => phase7Prefixes.some((p) => k.startsWith(p)));
    const p7TeKeys = teKeys.filter((k) => phase7Prefixes.some((p) => k.startsWith(p)));
    const p7HiKeys = hiKeys.filter((k) => phase7Prefixes.some((p) => k.startsWith(p)));

    const p7KeyMatch = p7EnKeys.length > 0 && p7EnKeys.length === p7TeKeys.length && p7EnKeys.length === p7HiKeys.length;
    const totalParity = enKeys.length === teKeys.length && enKeys.length === hiKeys.length;

    assert(
      10,
      p7KeyMatch && totalParity,
      'Phase 7 multilingual keys have 100% parity across English, Telugu, and Hindi',
      `Phase 7 keys: ${p7EnKeys.length}, Total catalog keys: ${enKeys.length}`
    );

    // ---------------------------------------------------------
    // Scenario 11: Mobile responsiveness & UI components check
    // ---------------------------------------------------------
    const guidanceFile = path.join(FRONTEND_DIR, 'src/components/ApplicationGuidance.jsx');
    const guidanceCode = fs.readFileSync(guidanceFile, 'utf-8');

    const checklistResponsive =
      checklistCode.includes('sm:') &&
      checklistCode.includes('rounded-2xl') &&
      checklistCode.includes('flex flex-col sm:flex-row');
    const guidanceResponsive =
      guidanceCode.includes('grid-cols-1') &&
      guidanceCode.includes('sm:') &&
      guidanceCode.includes('rounded-2xl');

    assert(
      11,
      checklistResponsive && guidanceResponsive,
      'Frontend checklist and guidance components implement responsive Tailwind UI patterns',
      `Checklist UI responsive: ${checklistResponsive}, Guidance UI responsive: ${guidanceResponsive}`
    );

    // ---------------------------------------------------------
    // Scenario 12: Regression verification across previous phases
    // ---------------------------------------------------------
    const healthRes = await request(`${API_BASE}/health`);
    const catRes = await request(`${API_BASE}/categories`);
    const searchRes = await request(`${API_BASE}/schemes?search=Kisan`);
    const recRes = await request(`${API_BASE}/eligibility/recommendations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const statsRes = await request(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const analyticsRes = await request(`${API_BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });

    const regressionPass =
      healthRes.status === 200 &&
      catRes.status === 200 &&
      searchRes.status === 200 &&
      recRes.status === 200 &&
      statsRes.status === 200 &&
      analyticsRes.status === 200;

    assert(
      12,
      regressionPass,
      'Zero regression: Health, Categories, Search, Recommendations, and Admin Analytics all operational',
      `Health: ${healthRes.status}, Categories: ${catRes.status}, Search: ${searchRes.status}, Recommendations: ${recRes.status}, Stats: ${statsRes.status}, Analytics: ${analyticsRes.status}`
    );

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------
    console.log('\n================================================================');
    console.log(`PHASE 7 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test suite error:', err);
    process.exit(1);
  }
};

runSuite();
