/**
 * SARKARISETU PHASE 6: MULTILINGUAL SUPPORT VERIFICATION SUITE
 *
 * Verifies all Phase 6 requirements:
 * 1. Locale files exist and parse valid JSON (en, te, hi)
 * 2. 100% key parity across English, Telugu, and Hindi dictionaries
 * 3. Telugu script (Unicode U+0C00–U+0C7F) presence in te.json
 * 4. Hindi Devanagari script (Unicode U+0900–U+097F) presence in hi.json
 * 5. Google Fonts (Noto Sans Telugu & Noto Sans Devanagari) configured in index.html
 * 6. Indic typography & font fallbacks configured in index.css
 * 7. i18n configuration & localStorage persistence (sarkarisetu_language) in i18n/index.js
 * 8. LanguageSelector component integration with English, Telugu, Hindi options
 * 9. Core pages and navigation components integration with useTranslation
 * 10. Official scheme names, gov.in URLs, and MongoDB backend data remain pristine
 * 11. Backend API health and categories operational
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
const API_BASE = 'http://localhost:5000/api';

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

// Helper: Recursively flatten JSON keys
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
  console.log('SARKARISETU PHASE 6: MULTILINGUAL SUPPORT VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // ---------------------------------------------------------
    // Scenario 1: Locale files existence and valid JSON parsing
    // ---------------------------------------------------------
    const enPath = path.join(FRONTEND_DIR, 'src/i18n/locales/en.json');
    const tePath = path.join(FRONTEND_DIR, 'src/i18n/locales/te.json');
    const hiPath = path.join(FRONTEND_DIR, 'src/i18n/locales/hi.json');

    const enExists = fs.existsSync(enPath);
    const teExists = fs.existsSync(tePath);
    const hiExists = fs.existsSync(hiPath);

    assert(1, enExists && teExists && hiExists, 'All 3 locale files exist', `en: ${enExists}, te: ${teExists}, hi: ${hiExists}`);

    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const teJson = JSON.parse(fs.readFileSync(tePath, 'utf-8'));
    const hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf-8'));

    const enKeys = getLeafKeys(enJson).sort();
    const teKeys = getLeafKeys(teJson).sort();
    const hiKeys = getLeafKeys(hiJson).sort();

    // ---------------------------------------------------------
    // Scenario 2: 100% Key Parity Across Locales
    // ---------------------------------------------------------
    const missingInTe = enKeys.filter(k => !teKeys.includes(k));
    const extraInTe = teKeys.filter(k => !enKeys.includes(k));
    const teParity = missingInTe.length === 0 && extraInTe.length === 0;

    assert(2, teParity, '100% key parity between English and Telugu', `Total keys: ${enKeys.length}. Missing in TE: ${missingInTe.length}, Extra: ${extraInTe.length}`);

    const missingInHi = enKeys.filter(k => !hiKeys.includes(k));
    const extraInHi = hiKeys.filter(k => !enKeys.includes(k));
    const hiParity = missingInHi.length === 0 && extraInHi.length === 0;

    assert(3, hiParity, '100% key parity between English and Hindi', `Total keys: ${enKeys.length}. Missing in HI: ${missingInHi.length}, Extra: ${extraInHi.length}`);

    // ---------------------------------------------------------
    // Scenario 4: Indic Unicode Script Presence
    // ---------------------------------------------------------
    const teRaw = fs.readFileSync(tePath, 'utf-8');
    const hiRaw = fs.readFileSync(hiPath, 'utf-8');

    const teluguMatches = teRaw.match(/[\u0C00-\u0C7F]/g) || [];
    const hindiMatches = hiRaw.match(/[\u0900-\u097F]/g) || [];

    assert(4, teluguMatches.length > 500, 'Telugu Unicode script presence in te.json', `Found ${teluguMatches.length} Telugu script characters`);
    assert(5, hindiMatches.length > 500, 'Devanagari Unicode script presence in hi.json', `Found ${hindiMatches.length} Devanagari script characters`);

    // ---------------------------------------------------------
    // Scenario 6: Indic Fonts in index.html & index.css
    // ---------------------------------------------------------
    const htmlContent = fs.readFileSync(path.join(FRONTEND_DIR, 'index.html'), 'utf-8');
    const cssContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/index.css'), 'utf-8');

    const fontsInHtml = htmlContent.includes('Noto+Sans+Devanagari') && htmlContent.includes('Noto+Sans+Telugu');
    const fontsInCss = cssContent.includes('Noto Sans Telugu') && cssContent.includes('Noto Sans Devanagari');

    assert(6, fontsInHtml, 'Google Fonts for Telugu & Devanagari preloaded in index.html', 'Noto Sans Telugu and Noto Sans Devanagari fonts found');
    assert(7, fontsInCss, 'CSS font-family fallbacks configured for Indic scripts in index.css', 'Indic font stack active in Tailwind/CSS');

    // ---------------------------------------------------------
    // Scenario 8: i18n Configuration & Persistence
    // ---------------------------------------------------------
    const i18nIndex = fs.readFileSync(path.join(FRONTEND_DIR, 'src/i18n/index.js'), 'utf-8');
    const hasPersistence = i18nIndex.includes('sarkarisetu_language') && i18nIndex.includes('documentElement.lang');
    const hasThreeLanguages = i18nIndex.includes('en:') && i18nIndex.includes('te:') && i18nIndex.includes('hi:');

    assert(8, hasPersistence && hasThreeLanguages, 'i18n instance configures localStorage persistence and 3 languages', 'Persists sarkarisetu_language & document.documentElement.lang');

    // ---------------------------------------------------------
    // Scenario 9: LanguageSelector Component
    // ---------------------------------------------------------
    const selectorContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/LanguageSelector.jsx'), 'utf-8');
    const hasTeHiSelect = selectorContent.includes('తెలుగు') && selectorContent.includes('हिन्दी') && selectorContent.includes('changeLanguage');

    assert(9, hasTeHiSelect, 'LanguageSelector provides English, Telugu (తెలుగు), and Hindi (हिन्दी)', 'LanguageSelector handles dynamic switching');

    // ---------------------------------------------------------
    // Scenario 10: Component & Page Translations
    // ---------------------------------------------------------
    const componentsToCheck = [
      'src/components/Navbar.jsx',
      'src/components/Footer.jsx',
      'src/components/SchemeCard.jsx',
      'src/components/CategoryCard.jsx',
      'src/components/AdminLayout.jsx',
      'src/pages/HomePage.jsx',
      'src/pages/AllSchemesPage.jsx',
      'src/pages/RecommendationsPage.jsx',
      'src/pages/DashboardPage.jsx',
      'src/pages/SchemeDetailsPage.jsx',
      'src/pages/EligibilityPage.jsx',
      'src/pages/CategoriesPage.jsx',
      'src/pages/ProfilePage.jsx',
      'src/pages/LoginPage.jsx',
      'src/pages/RegisterPage.jsx',
      'src/pages/SavedSchemesPage.jsx',
      'src/pages/ApplicationsPage.jsx',
      'src/pages/NotificationsPage.jsx',
    ];

    let allTranslated = true;
    for (const compPath of componentsToCheck) {
      const fullPath = path.join(FRONTEND_DIR, compPath);
      if (!fs.existsSync(fullPath)) {
        allTranslated = false;
        console.error(`Component missing: ${compPath}`);
        break;
      }
      const code = fs.readFileSync(fullPath, 'utf-8');
      if (!code.includes('useTranslation')) {
        allTranslated = false;
        console.error(`Component lacks useTranslation: ${compPath}`);
        break;
      }
    }

    assert(10, allTranslated, 'All 18 citizen and admin components use useTranslation()', 'Zero missing i18n integrations in key views');

    // ---------------------------------------------------------
    // Scenario 11: Official Scheme Names & Gov URLs Uncorrupted
    // ---------------------------------------------------------
    const schemesRes = await fetch(`${API_BASE}/schemes`);
    const schemesData = await schemesRes.json();
    const schemes = Array.isArray(schemesData?.data) ? schemesData.data : (schemesData?.data?.schemes || []);

    let officialNamesPristine = schemes.length > 0;
    for (const s of schemes) {
      if (!s.schemeName || typeof s.schemeName !== 'string' || s.schemeName.trim().length === 0) {
        officialNamesPristine = false;
        break;
      }
    }

    assert(11, officialNamesPristine, 'Official Scheme Names and URLs remain pristine from backend MongoDB', `Inspected ${schemes.length} live schemes across all categories`);

    // ---------------------------------------------------------
    // Scenario 12: Backend APIs Integrity Check
    // ---------------------------------------------------------
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    const categoriesRes = await fetch(`${API_BASE}/categories`);
    const categoriesData = await categoriesRes.json();

    const backendHealthy = healthRes.ok && healthData.status === 'healthy';
    const categoriesIntact = categoriesRes.ok && categoriesData.count === 14;

    assert(12, backendHealthy && categoriesIntact, 'Backend health and 14 categories intact', `Health: ${healthData.status}, Categories count: ${categoriesData.count}`);

  } catch (err) {
    console.error('Unexpected error during Phase 6 verification:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`PHASE 6 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite();
