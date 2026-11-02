import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  MapPin,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRecommendations, getCategories } from '../services/api';
import { SchemeCardSkeleton } from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';

const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
];

const RecommendationsPage = () => {
  const { t } = useTranslation();
  const { user, isSchemeSaved, toggleSaveScheme } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [filledFields, setFilledFields] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Sorting state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'strong', 'potential', 'needs_info'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [sortBy, setSortBy] = useState('score_desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Track expanded cards for detailed criteria
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpanded = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Fetch recommendations
  const fetchRecommendations = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [recRes, catRes] = await Promise.all([
        getRecommendations(),
        getCategories(),
      ]);

      if (recRes?.data) {
        setRecommendations(recRes.data);
        setProfileCompletion(recRes.profileCompletion || 0);
        setMissingFields(recRes.missingFields || []);
        setFilledFields(recRes.filledFields || []);
      }

      if (catRes?.data) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError(err.message || 'Unable to load personalized recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleBookmarkToggle = async (schemeId) => {
    try {
      await toggleSaveScheme(schemeId);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Filter & sort recommendations in memory for instant reactivity
  const filteredRecommendations = useMemo(() => {
    let list = [...recommendations];

    // Filter by Active Tab
    if (activeTab === 'strong') {
      list = list.filter((r) => r.matchType === 'strong' || (r.matchPercentage >= 75 && !r.hasUnmetConditions));
    } else if (activeTab === 'potential') {
      list = list.filter(
        (r) =>
          (r.matchType === 'potential' || (r.matchPercentage >= 40 && r.matchPercentage < 75)) &&
          !r.hasUnmetConditions
      );
    } else if (activeTab === 'needs_info') {
      list = list.filter((r) => r.needsMoreInfo && !r.hasUnmetConditions);
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      list = list.filter(
        (r) => r.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by State
    if (selectedState !== 'All') {
      const stateTarget = selectedState.toLowerCase();
      list = list.filter((r) => {
        if (r.state === 'All India') return true;
        if (r.state && r.state.toLowerCase() === stateTarget) return true;
        if (
          r.scheme?.eligibleStates &&
          r.scheme.eligibleStates.some(
            (st) => st.toLowerCase() === stateTarget || st === 'All India'
          )
        ) {
          return true;
        }
        return false;
      });
    }

    // In-page search by scheme name or department
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.schemeName.toLowerCase().includes(q) ||
          (r.department && r.department.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'score_asc') {
      list.sort((a, b) => a.matchPercentage - b.matchPercentage);
    } else if (sortBy === 'recently_added') {
      list.sort((a, b) => new Date(b.scheme?.createdAt || 0) - new Date(a.scheme?.createdAt || 0));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
    } else {
      // score_desc (default)
      list.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return new Date(b.scheme?.createdAt || 0) - new Date(a.scheme?.createdAt || 0);
      });
    }

    return list;
  }, [recommendations, activeTab, selectedCategory, selectedState, searchQuery, sortBy]);

  // Tab counts
  const strongCount = recommendations.filter(
    (r) => r.matchType === 'strong' || (r.matchPercentage >= 75 && !r.hasUnmetConditions)
  ).length;

  const potentialCount = recommendations.filter(
    (r) =>
      (r.matchType === 'potential' || (r.matchPercentage >= 40 && r.matchPercentage < 75)) &&
      !r.hasUnmetConditions
  ).length;

  const needsInfoCount = recommendations.filter(
    (r) => r.needsMoreInfo && !r.hasUnmetConditions
  ).length;

  const resetFilters = () => {
    setActiveTab('all');
    setSelectedCategory('All');
    setSelectedState('All');
    setSearchQuery('');
    setSortBy('score_desc');
  };

  // Map missing field names to friendly translated labels
  const formatFieldName = (fieldName) => {
    const map = {
      age: t('profile.age', 'Age'),
      gender: t('profile.gender', 'Gender'),
      state: t('profile.state', 'State'),
      district: t('profile.district', 'District'),
      occupation: t('profile.occupation', 'Occupation'),
      annualIncome: t('profile.income', 'Annual Income'),
      ruralOrUrban: t('profile.residence', 'Residential Area'),
      category: t('profile.socialCategory', 'Social Category'),
      studentStatus: t('profile.student', 'Student Status'),
      farmerStatus: t('profile.farmer', 'Farmer Status'),
      disabilityStatus: t('profile.disability', 'Disability Status'),
    };
    return map[fieldName] || fieldName;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Welcome Banner */}
      <div className="bg-gradient-to-r from-gov-blue to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('recommendations.badge', 'Smart Personalized Recommendations')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('recommendations.title', 'Recommended for You')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {t('recommendations.welcome', { name: user?.name || t('common.user', 'Citizen'), defaultValue: `Welcome, ${user?.name || 'Citizen'}!` })}{' '}
              {t('recommendations.subtitle', 'SarkariSetu has evaluated all active national and state welfare schemes against your profile parameters.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('common.loading', 'Refreshing...') : t('common.refresh', 'Refresh Recommendations')}</span>
            </button>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow transition"
            >
              <User className="w-4 h-4" />
              <span>{t('dashboard.completeProfile', 'Complete Profile')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Mandatory Informational Legal Advisory */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 sm:p-5 flex items-start gap-3 text-slate-800 text-xs sm:text-sm shadow-xs">
        <ShieldCheck className="w-5 h-5 text-gov-blue flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-slate-700 leading-relaxed font-medium">
            {t('recommendations.officialAdvisory', 'Official Informational Advisory: These recommendations are informational only. Final eligibility is determined by the relevant government department. Please check the official scheme guidelines before applying.')}
          </p>
        </div>
      </div>

      {/* 3. Profile Completion & Guidance Widget */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('recommendations.profileScore', 'Profile Completeness')}
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  profileCompletion === 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : profileCompletion >= 70
                    ? 'bg-blue-100 text-gov-blue'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {profileCompletion}% {t('common.active', 'Complete')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {profileCompletion === 100
                ? t('dashboard.profileAccuracy', 'Your citizen profile is fully completed. All matching rules operate with highest precision.')
                : t('recommendations.completeTitle', 'Complete your profile to unlock more accurate scheme matches.')}
            </p>
          </div>

          {profileCompletion < 100 && (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gov-blue text-white hover:bg-blue-900 text-xs font-bold transition flex-shrink-0"
            >
              <span>{t('dashboard.completeProfile', 'Update Profile')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              profileCompletion === 100
                ? 'bg-emerald-500'
                : profileCompletion >= 70
                ? 'bg-gov-blue'
                : 'bg-amber-500'
            }`}
            style={{ width: `${profileCompletion}%` }}
          />
        </div>

        {/* Missing fields breakdown chips */}
        {missingFields.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              {t('recommendations.missingPrompt', 'Recommended fields to complete:')}
            </span>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium"
                >
                  <Info className="w-3 h-3 text-amber-600" />
                  <span>{formatFieldName(field)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Recommendation Tabs & Quick Filters */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-gov-blue text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{t('recommendations.tabs.all', 'All Recommended')}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {recommendations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('strong')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'strong'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('recommendations.tabs.strong', 'Strong Profile Matches')}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'strong' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 font-extrabold'
              }`}
            >
              {strongCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('potential')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'potential'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{t('recommendations.tabs.potential', 'Other Potential Matches')}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'potential' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {potentialCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('needs_info')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'needs_info'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('recommendations.tabs.needsInfo', 'Needs More Information')}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'needs_info' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800 font-extrabold'
              }`}
            >
              {needsInfoCount}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search within recommended */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('recommendations.searchPlaceholder', 'Search in recommendations...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue transition"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs text-slate-800 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue transition bg-white"
            >
              <option value="All">{t('allSchemes.allCategories', 'All Categories')}</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* State Dropdown */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs text-slate-800 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue transition bg-white"
            >
              <option value="All">{t('allSchemes.allStates', 'All States / National')}</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs text-slate-800 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue transition bg-white"
            >
              <option value="score_desc">{t('recommendations.sortOptions.scoreDesc', 'Match Score: Highest First')}</option>
              <option value="score_asc">{t('recommendations.sortOptions.scoreAsc', 'Match Score: Lowest First')}</option>
              <option value="recently_added">{t('recommendations.sortOptions.recentlyAdded', 'Recently Added Schemes')}</option>
              <option value="name_asc">{t('recommendations.sortOptions.nameAsc', 'Scheme Name (A to Z)')}</option>
            </select>
          </div>
        </div>

        {/* Results summary & Active filter reset */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span>
            {t('recommendations.showing', {
              count: filteredRecommendations.length,
              total: recommendations.length,
              defaultValue: `Showing ${filteredRecommendations.length} of ${recommendations.length} evaluated schemes`
            })}
          </span>

          {(selectedCategory !== 'All' || selectedState !== 'All' || searchQuery.trim() || activeTab !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-gov-blue hover:underline font-semibold"
            >
              {t('allSchemes.resetFilters', 'Reset Filters')}
            </button>
          )}
        </div>
      </div>

      {/* 5. Recommendation Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SchemeCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-bold text-base">Error Loading Recommendations</h3>
          <p className="text-xs sm:text-sm">{error}</p>
          <button
            type="button"
            onClick={() => fetchRecommendations(true)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <Compass className="w-14 h-14 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {t('recommendations.emptyTitle', 'No Matching Schemes Found')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {t('recommendations.emptyDesc', 'No government schemes match your active filter criteria. Try resetting filters or exploring the complete directory of 70 government schemes.')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              {t('allSchemes.resetFilters', 'Reset Active Filters')}
            </button>
            <Link
              to="/schemes"
              className="px-4 py-2.5 rounded-lg bg-gov-blue text-white text-xs font-bold hover:bg-blue-900 transition shadow"
            >
              {t('dashboard.exploreMore', 'Explore All Schemes')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => {
            const isSaved = isSchemeSaved(rec.schemeId);
            const isExpanded = !!expandedCards[rec.schemeId];

            return (
              <div
                key={rec.schemeId}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition group"
              >
                <div className="space-y-3">
                  {/* Category Pill & Match Percentage Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-100">
                      <CategoryIcon category={rec.category} className="w-3.5 h-3.5" />
                      <span>{rec.category}</span>
                    </span>

                    {/* Match Score Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        rec.matchPercentage >= 75 && !rec.hasUnmetConditions
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : rec.matchPercentage >= 50 && !rec.hasUnmetConditions
                          ? 'bg-blue-50 text-blue-800 border border-blue-300'
                          : rec.needsMoreInfo && !rec.hasUnmetConditions
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span>{rec.matchPercentage}% {t('schemeCard.match', 'Match')}</span>
                    </span>
                  </div>

                  {/* Scheme Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2 leading-snug">
                    <Link to={`/schemes/${rec.schemeId}`}>
                      {rec.schemeName}
                    </Link>
                  </h3>

                  {/* Department & State */}
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-start gap-1.5 line-clamp-1">
                      <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>{rec.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span>{rec.state}</span>
                    </div>
                  </div>

                  {/* "Why This Scheme Matches" Highlight Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('recommendations.whyMatches', 'Why it matches your profile')}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.matchReason}
                    </p>
                  </div>

                  {/* Expandable Criteria Details Accordion */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCardExpanded(rec.schemeId)}
                      className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-xs font-semibold text-slate-700 transition"
                    >
                      <span>
                        {t('recommendations.breakdownTitle', 'Eligibility Breakdown')} ({rec.matchedConditions?.length || 0} Met,{' '}
                        {rec.unmetConditions?.length || 0} Unmet)
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-white space-y-2 text-xs border-t border-slate-100">
                        {/* Matched Conditions */}
                        {rec.matchedConditions && rec.matchedConditions.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                              {t('recommendations.condsMet', 'Conditions Satisfied')}
                            </span>
                            {rec.matchedConditions.map((cond, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-emerald-800 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>{cond}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Unmet Conditions */}
                        {rec.unmetConditions && rec.unmetConditions.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
                              {t('recommendations.condsUnmet', 'Conditions Not Satisfied')}
                            </span>
                            {rec.unmetConditions.map((cond, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-red-800 text-[11px]">
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{cond}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Missing Profile Information */}
                        {rec.missingInformation && rec.missingInformation.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                              {t('recommendations.missingDetails', 'Missing Profile Details')}
                            </span>
                            {rec.missingInformation.map((info, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-amber-800 text-[11px]">
                                <HelpCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span>{info}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Key Benefits Snippet */}
                  {rec.benefits && rec.benefits.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {t('recommendations.keyBenefit', 'Key Benefit:')}
                      </span>
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        • {rec.benefits[0]}
                      </p>
                    </div>
                  )}

                  {/* Official Portal Application Link */}
                  {rec.officialWebsite && (
                    <div className="pt-1">
                      <a
                        href={rec.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-blue transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('schemeDetails.officialPortal', 'Official Portal Guidelines')}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Actions: Save Bookmark & View Details */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => handleBookmarkToggle(rec.schemeId)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      isSaved
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t('schemeCard.saved', 'Saved')}</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{t('schemeCard.saveScheme', 'Save Scheme')}</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/schemes/${rec.schemeId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:text-blue-900 transition"
                  >
                    <span>{t('schemeCard.viewDetails', 'View Details')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
