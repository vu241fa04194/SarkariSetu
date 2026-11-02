import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Bookmark,
  BookmarkCheck,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { checkEligibility, getSchemes } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryIcon from '../components/CategoryIcon';
import { LoadingSpinner } from '../components/LoadingSpinner';

import { INDIAN_STATES as ALL_INDIAN_STATES } from '../data/stateDistricts';

const INDIAN_STATES = ['All India', ...ALL_INDIAN_STATES];

const OCCUPATION_OPTIONS = [
  'Farmer',
  'Student',
  'Self-Employed / Business',
  'Daily Wage Worker',
  'Unemployed',
  'Private Employee',
  'Government Employee',
  'Shopkeeper / Vendor',
  'Retired / Senior',
  'Artisan / Craftsman',
  'Other',
];

const EligibilityPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isSchemeSaved, toggleSaveScheme } = useAuth();

  const [formProfile, setFormProfile] = useState({
    age: '',
    gender: 'All',
    state: 'All India',
    occupation: '',
    annualIncome: '',
    ruralOrUrban: 'Both',
    category: 'General',
    farmerStatus: false,
    studentStatus: false,
    disabilityStatus: false,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'Potentially Eligible' | 'Partially Matched'

  // Prepopulate form if authenticated user exists
  useEffect(() => {
    if (user) {
      setFormProfile({
        age: user.age != null ? String(user.age) : '',
        gender: user.gender || 'All',
        state: user.state || 'All India',
        occupation: user.occupation || '',
        annualIncome: user.annualIncome != null ? String(user.annualIncome) : '',
        ruralOrUrban: user.ruralOrUrban || 'Both',
        category: user.category || 'General',
        farmerStatus: !!user.farmerStatus,
        studentStatus: !!user.studentStatus,
        disabilityStatus: !!user.disabilityStatus,
      });
      // Automatically run evaluation on mount for logged-in user
      runEvaluation({
        age: user.age,
        gender: user.gender,
        state: user.state,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        ruralOrUrban: user.ruralOrUrban,
        category: user.category,
        farmerStatus: user.farmerStatus,
        studentStatus: user.studentStatus,
        disabilityStatus: user.disabilityStatus,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const runEvaluation = async (profileToTest) => {
    try {
      setLoading(true);
      setError(null);
      const res = await checkEligibility(profileToTest);
      if (res?.data) {
        setResults(res.data);
        setHasEvaluated(true);
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      setError(err.message || 'Failed to calculate scheme eligibility.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    runEvaluation(formProfile);
  };

  const handleReset = () => {
    const emptyProfile = {
      age: '',
      gender: 'All',
      state: 'All India',
      occupation: '',
      annualIncome: '',
      ruralOrUrban: 'Both',
      category: 'General',
      farmerStatus: false,
      studentStatus: false,
      disabilityStatus: false,
    };
    setFormProfile(emptyProfile);
    setResults([]);
    setHasEvaluated(false);
  };

  const toggleExpand = (schemeId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [schemeId]: !prev[schemeId],
    }));
  };

  // Filter results by status tab
  const displayedResults = results.filter((item) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Potentially Eligible') return item.matchPercentage >= 75;
    if (filterStatus === 'Partially Matched')
      return item.matchPercentage >= 50 && item.matchPercentage < 75;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-gov-blue text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('recommendations.badge', 'Smart Eligibility Finder')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('eligibility.title', 'Check Government Scheme Eligibility')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('eligibility.subtitle', 'Provide your demographic details to evaluate potential match percentages against 70 government welfare schemes.')}
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gov-blue" />
                <h3 className="font-bold text-sm text-slate-900">{t('eligibility.formTitle', 'Your Criteria Profile')}</h3>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('common.reset', 'Reset')}</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Age */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.age', 'Citizen Age (Years)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  name="age"
                  value={formProfile.age}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.gender', 'Gender')}
                </label>
                <select
                  name="gender"
                  value={formProfile.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                >
                  <option value="All">{t('allSchemes.allStates', 'All / Any Gender')}</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.state', 'State of Residence')}
                </label>
                <select
                  name="state"
                  value={formProfile.state}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.occupation', 'Occupation / Work')}
                </label>
                <select
                  name="occupation"
                  value={formProfile.occupation}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                >
                  <option value="">{t('allSchemes.allCategories', 'Any / General')}</option>
                  {OCCUPATION_OPTIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              {/* Annual Income */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.income', 'Annual Household Income (₹)')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  name="annualIncome"
                  value={formProfile.annualIncome}
                  onChange={handleChange}
                  placeholder="e.g. 200000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                />
              </div>

              {/* Area Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.residence', 'Residential Area')}
                </label>
                <select
                  name="ruralOrUrban"
                  value={formProfile.ruralOrUrban}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                >
                  <option value="Both">Both / Any</option>
                  <option value="Rural">Rural (Village)</option>
                  <option value="Urban">Urban (City)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('profile.socialCategory', 'Social Category')}
                </label>
                <select
                  name="category"
                  value={formProfile.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="Minorities">Minorities</option>
                </select>
              </div>

              {/* Checkbox Flags */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="farmerStatus"
                    checked={formProfile.farmerStatus}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 text-gov-blue rounded border-slate-300"
                  />
                  <span>{t('profile.farmer', 'Farmer / Agricultural family')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="studentStatus"
                    checked={formProfile.studentStatus}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 text-gov-blue rounded border-slate-300"
                  />
                  <span>{t('profile.student', 'Currently enrolled student')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="disabilityStatus"
                    checked={formProfile.disabilityStatus}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 text-gov-blue rounded border-slate-300"
                  />
                  <span>{t('profile.disability', 'Person with Disability (Divyangjan)')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white font-bold text-xs shadow transition disabled:opacity-60"
              >
                <span>{loading ? t('common.loading', 'Evaluating...') : t('common.search', 'Find Eligible Schemes')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Evaluated Results List (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Statutory Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">{t('recommendations.badge', 'Eligibility Advisory')}:</strong> {t('recommendations.officialAdvisory', 'Eligibility is indicative only. The SarkariSetu engine estimates alignment based on published scheme rules. Results indicate potential eligibility and do not guarantee benefits or scheme approval. Check official portal for complete requirements before applying.')}
            </div>
          </div>

          {/* Filter Tabs if results available */}
          {results.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
              <span className="font-bold text-slate-700">
                {t('recommendations.showing', { count: results.length, total: results.length, defaultValue: `Found ${results.length} schemes evaluated against your profile` })}
              </span>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {['All', 'Potentially Eligible', 'Partially Matched'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      filterStatus === tab
                        ? 'bg-white text-gov-blue shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'All' ? t('recommendations.tabs.all', 'All') : tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner text={t('common.loading', 'Analyzing criteria and ranking schemes...')} />}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center text-xs">
              {error}
            </div>
          )}

          {/* Initial State / Prompt */}
          {!loading && !hasEvaluated && results.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center mx-auto">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t('eligibility.formTitle', 'Enter your details to calculate scheme eligibility')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {t('eligibility.formSubtitle', 'Fill in the form on the left with your age, location, income, and category to see which Central and State government programs you potentially qualify for.')}
              </p>
            </div>
          )}

          {/* Evaluated Scheme Cards */}
          {!loading && hasEvaluated && displayedResults.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              {t('recommendations.emptyDesc', 'No schemes found in the selected tab. Try switching to "All".')}
            </div>
          )}

          {!loading &&
            hasEvaluated &&
            displayedResults.map((item) => {
              const schemeId = item.schemeId || item.scheme?._id;
              const isExpanded = !!expandedCards[schemeId];
              const isSaved = isSchemeSaved(schemeId);

              return (
                <div
                  key={schemeId}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Top Bar: Category, State, Percentage */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-100">
                        <CategoryIcon category={item.category} className="w-3.5 h-3.5" />
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.state}
                      </span>
                    </div>

                    {/* Match percentage pill */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                          item.matchPercentage >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : item.matchPercentage >= 50
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.matchPercentage}% {t('schemeCard.match', 'Match')}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        ({item.status})
                      </span>
                    </div>
                  </div>

                  {/* Title & Department */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-gov-blue">
                      <Link to={`/schemes/${schemeId}`}>
                        {item.schemeName}
                      </Link>
                    </h3>
                    <div className="flex items-start gap-1 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{item.department}</span>
                    </div>
                  </div>

                  {/* Criteria Breakdown Box */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t('recommendations.breakdownTitle', 'Criteria Evaluation Breakdown')}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(schemeId)}
                        className="text-xs font-bold text-gov-blue hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? t('common.cancel', 'Collapse') : t('schemeCard.viewDetails', 'View Full Breakdown')}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Matched conditions list */}
                    <div className="space-y-1.5 text-xs">
                      {item.matchedConditions
                        .slice(0, isExpanded ? item.matchedConditions.length : 2)
                        .map((cond, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{cond}</span>
                          </div>
                        ))}
                    </div>

                    {/* Unmet conditions list */}
                    {item.unmetConditions.length > 0 && (
                      <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/60">
                        {item.unmetConditions
                          .slice(0, isExpanded ? item.unmetConditions.length : 1)
                          .map((cond, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-red-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="leading-snug">{cond}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Missing information */}
                    {item.missingInformation.length > 0 && isExpanded && (
                      <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/60">
                        {item.missingInformation.map((info, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-amber-800">
                            <span className="text-[10px] bg-amber-200 px-1 rounded font-bold">INFO</span>
                            <span className="leading-snug">{info}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAuthenticated) {
                          toggleSaveScheme(schemeId);
                        } else {
                          alert('Please create an account or sign in to bookmark schemes.');
                        }
                      }}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        isSaved
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('schemeCard.saved', 'Saved Scheme')}</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{t('schemeCard.saveScheme', 'Save to Dashboard')}</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/schemes/${schemeId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:text-blue-900"
                    >
                      <span>{t('schemeCard.viewDetails', 'View Scheme Details & Apply')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default EligibilityPage;
