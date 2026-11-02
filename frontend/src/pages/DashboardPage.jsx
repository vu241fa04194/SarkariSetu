import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bookmark,
  Compass,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  BookmarkCheck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRecommendations, getSavedSchemes, getMyChecklists } from '../services/api';
import { LoadingSpinner, SchemeCardSkeleton } from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, isSchemeSaved, toggleSaveScheme } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [recRes, savedRes, checkRes] = await Promise.all([
          getRecommendations(),
          getSavedSchemes(),
          getMyChecklists(),
        ]);

        if (recRes?.data) {
          setRecommendations(recRes.data);
          setProfileCompletion(recRes.profileCompletion || 0);
        }

        if (savedRes?.data) {
          setSavedSchemes(savedRes.data);
        }

        if (checkRes?.data) {
          setChecklists(checkRes.data);
        }

        // Load recently viewed from localStorage
        try {
          const stored = localStorage.getItem('sarkarisetu_recently_viewed');
          if (stored) {
            setRecentlyViewed(JSON.parse(stored).slice(0, 4));
          }
        } catch (e) {
          console.warn('Failed to parse recently viewed schemes', e);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleBookmarkToggle = async (schemeId) => {
    try {
      await toggleSaveScheme(schemeId);
      // Refresh saved list
      const updatedSaved = await getSavedSchemes();
      if (updatedSaved?.data) {
        setSavedSchemes(updatedSaved.data);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const potentiallyEligibleCount = recommendations.filter(
    (r) => r.matchPercentage >= 75
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gov-blue to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('dashboard.verifiedProfile', 'Verified Citizen Profile')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: user?.name || t('common.user', 'Citizen'), defaultValue: `Welcome back, ${user?.name || 'Citizen'}!` })}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {t('dashboard.smartAdvisory', 'SarkariSetu Smart Eligibility Engine has evaluated your profile against national and state welfare schemes.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/eligibility"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('eligibility.title', 'Eligibility Checker')}</span>
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition"
          >
            <span>{t('profile.title', 'Edit Profile')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics & Profile Completion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.profileAccuracy', 'Profile Accuracy')}
            </span>
            <span className="text-sm font-extrabold text-gov-blue">
              {profileCompletion}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                profileCompletion >= 80
                  ? 'bg-emerald-500'
                  : profileCompletion >= 50
                  ? 'bg-amber-500'
                  : 'bg-gov-blue'
              }`}
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {profileCompletion === 100
              ? t('dashboard.profileAccuracy', 'Your citizen profile is fully completed. All matching rules operate with highest precision.')
              : t('recommendations.completeTitle', 'Complete your profile to unlock more accurate scheme matches.')}
          </p>

          {profileCompletion < 100 && (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:text-blue-900"
            >
              <span>{t('dashboard.completeProfile', 'Complete Profile Details')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* High Match Count Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.potentiallyEligible', 'Potentially Eligible')}
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">
              {potentiallyEligibleCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('dashboard.eligibleDesc', 'Government schemes where your citizen profile meets 75% or more of specified criteria.')}
            </p>
          </div>
          <a
            href="#recommendations"
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>{t('dashboard.reviewMatches', 'Review matches below')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Saved Schemes Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('dashboard.bookmarked', 'Bookmarked Schemes')}
            </span>
            <div className="text-3xl font-extrabold text-gov-blue mt-2">
              {savedSchemes.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('dashboard.bookmarkedDesc', 'Schemes you have saved for application preparation or offline document collection.')}
            </p>
          </div>
          <Link
            to="/saved-schemes"
            className="text-xs font-bold text-gov-blue hover:text-blue-900 flex items-center gap-1"
          >
            <span>{t('dashboard.viewSaved', { count: savedSchemes.length, defaultValue: `View Saved Schemes (${savedSchemes.length})` })}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Recommendations Section */}
      <section id="recommendations" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
              {t('dashboard.smartMatchesTitle', 'Smart Personalized Matches')}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t('dashboard.schemesMatching', 'Schemes Matching Your Profile')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('dashboard.evaluatedAgainst', {
                age: user?.age || t('common.notSet', 'Not set'),
                state: user?.state || t('allSchemes.allStates', 'All'),
                occupation: user?.occupation || 'General',
                defaultValue: `Evaluated against your age (${user?.age || 'Not set'}), state (${user?.state || 'All'}), occupation (${user?.occupation || 'General'}), and income criteria.`
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gov-blue text-white hover:bg-blue-900 text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('dashboard.fullRecommendations', 'Recommended For You')}</span>
            </Link>
            <Link
              to="/eligibility"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:text-blue-900"
            >
              <span>{t('dashboard.customizeInChecker', 'Custom Checker')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recommendations Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SchemeCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">{t('dashboard.noRecsTitle', 'No Recommendations Available')}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('dashboard.noRecsDesc', 'Update your citizen profile parameters to generate recommendations.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 9).map((rec) => {
              const isSaved = isSchemeSaved(rec.schemeId);

              return (
                <div
                  key={rec.schemeId}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div>
                    {/* Header: Category + Match Percentage */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-100">
                        <CategoryIcon category={rec.category} className="w-3.5 h-3.5" />
                        {rec.category}
                      </span>

                      {/* Match Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          rec.matchPercentage >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rec.matchPercentage >= 50
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {rec.matchPercentage}% {t('schemeCard.match', 'Match')}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="mb-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          rec.matchPercentage >= 75
                            ? 'text-emerald-700'
                            : rec.matchPercentage >= 50
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    {/* Scheme Name */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2 mb-2 leading-snug">
                      <Link to={`/schemes/${rec.schemeId}`}>
                        {rec.schemeName}
                      </Link>
                    </h3>

                    {/* Department */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-3 line-clamp-1">
                      <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>{rec.department}</span>
                    </div>

                    {/* Conditions Breakdown Snippet */}
                    <div className="space-y-1.5 text-xs my-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {rec.matchedConditions.slice(0, 2).map((cond, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
                          <span className="line-clamp-1 text-[11px]">{cond}</span>
                        </div>
                      ))}

                      {rec.unmetConditions.slice(0, 1).map((cond, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-red-700">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                          <span className="line-clamp-1 text-[11px]">{cond}</span>
                        </div>
                      ))}

                      {rec.missingInformation.slice(0, 1).map((info, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-amber-700">
                          <span className="text-[10px] bg-amber-200 px-1 rounded font-bold">INFO</span>
                          <span className="line-clamp-1 text-[11px]">{info}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => handleBookmarkToggle(rec.schemeId)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
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
                          <span>{t('schemeCard.saveScheme', 'Save')}</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/schemes/${rec.schemeId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:text-blue-900"
                    >
                      <span>{t('schemeCard.viewDetails', 'Full Details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Phase 7: My Document Checklists Widget */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('checklist.dashboardWidgetTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('checklist.dashboardWidgetSubtitle')}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {checklists.length} {checklists.length === 1 ? 'Scheme' : 'Schemes'} Tracked
          </span>
        </div>

        {checklists.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 space-y-2">
            <p>{t('checklist.noChecklistsDashboard')}</p>
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:underline"
            >
              <span>{t('saved.browseBtn', 'Browse Schemes Directory')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((chk) => {
              const collected = chk.items?.filter((i) => i.status === 'collected').length || 0;
              const total = chk.items?.length || 0;
              const pct = chk.completionPercentage || 0;

              return (
                <div
                  key={chk._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gov-blue block">
                      {chk.scheme?.category || 'General Welfare'}
                    </span>
                    <Link
                      to={`/schemes/${chk.scheme?._id}`}
                      className="font-bold text-xs sm:text-sm text-slate-900 hover:text-gov-blue line-clamp-1 block"
                    >
                      {chk.scheme?.schemeName || 'Government Scheme'}
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>{t('checklist.completion')}:</span>
                      <span className="font-bold text-gov-blue">
                        {collected}/{total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct === 100 ? 'bg-emerald-600' : pct >= 50 ? 'bg-gov-blue' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {chk.personalNotes ? 'Notes recorded' : 'No personal notes'}
                    </span>
                    <Link
                      to={`/schemes/${chk.scheme?._id}`}
                      className="font-bold text-gov-blue hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <span>Prepare</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-Column Widget Section: Saved Schemes & Recently Viewed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Schemes Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">{t('dashboard.yourSavedTitle', 'Your Saved Schemes')}</h3>
            </div>
            <Link
              to="/saved-schemes"
              className="text-xs font-bold text-gov-blue hover:underline"
            >
              {t('dashboard.viewAllSaved', { count: savedSchemes.length, defaultValue: `View All (${savedSchemes.length})` })}
            </Link>
          </div>

          {savedSchemes.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              {t('dashboard.noSavedDesc', "You haven't bookmarked any schemes yet. Click the 'Save Scheme' button on any scheme card to save it here.")}
            </p>
          ) : (
            <div className="space-y-3">
              {savedSchemes.slice(0, 3).map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <Link
                      to={`/schemes/${s._id}`}
                      className="text-xs font-bold text-slate-900 hover:text-gov-blue line-clamp-1"
                    >
                      {s.schemeName}
                    </Link>
                    <span className="text-[11px] text-slate-500 block">
                      {s.category} • {s.state}
                    </span>
                  </div>
                  <Link
                    to={`/schemes/${s._id}`}
                    className="text-xs font-bold text-gov-blue hover:text-blue-900 flex-shrink-0"
                  >
                    {t('schemeCard.viewDetails', 'View')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Viewed Schemes Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-base text-slate-900">{t('dashboard.recentlyViewed', 'Recently Viewed')}</h3>
            </div>
            <Link to="/schemes" className="text-xs font-bold text-gov-blue hover:underline">
              {t('dashboard.exploreMore', 'Explore More')}
            </Link>
          </div>

          {recentlyViewed.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              {t('dashboard.noRecentDesc', 'No schemes viewed recently. Explore schemes to see your history here.')}
            </p>
          ) : (
            <div className="space-y-3">
              {recentlyViewed.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <Link
                      to={`/schemes/${s._id}`}
                      className="text-xs font-bold text-slate-900 hover:text-gov-blue line-clamp-1"
                    >
                      {s.schemeName}
                    </Link>
                    <span className="text-[11px] text-slate-500 block">
                      {s.category} • {s.department}
                    </span>
                  </div>
                  <Link
                    to={`/schemes/${s._id}`}
                    className="text-xs font-bold text-gov-blue hover:text-blue-900 flex-shrink-0"
                  >
                    {t('schemeCard.viewDetails', 'View')}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
