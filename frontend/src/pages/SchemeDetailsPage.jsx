import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  ListOrdered,
  FileCheck,
  AlertCircle,
  Share2,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  SlidersHorizontal,
  Sparkles,
  ClipboardList,
  Clock,
  X,
} from 'lucide-react';
import {
  getSchemeById,
  checkEligibility,
  trackSchemeView,
  trackApplication,
  getMyApplications,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryIcon from '../components/CategoryIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import SmartDocumentChecklist from '../components/SmartDocumentChecklist';
import ApplicationGuidance from '../components/ApplicationGuidance';

const SchemeDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isSchemeSaved, toggleSaveScheme } = useAuth();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Phase 3 & 7: Application Tracker State
  const [applicationRecord, setApplicationRecord] = useState(null);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackerStatus, setTrackerStatus] = useState('Interested');
  const [trackerRef, setTrackerRef] = useState('');
  const [trackerNotes, setTrackerNotes] = useState('');
  const [trackerSubDate, setTrackerSubDate] = useState('');
  const [savingTracker, setSavingTracker] = useState(false);

  useEffect(() => {
    const fetchScheme = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getSchemeById(id);
        if (res?.data) {
          const schemeData = res.data;
          setScheme(schemeData);

          // Phase 3: Atomic database view count track
          try {
            trackSchemeView(id);
          } catch (vErr) {
            console.warn('View tracking error:', vErr);
          }

          // Track in recently viewed in localStorage
          try {
            const stored = localStorage.getItem('sarkarisetu_recently_viewed');
            let list = stored ? JSON.parse(stored) : [];
            // Remove existing duplicate
            list = list.filter((item) => item._id !== schemeData._id);
            // Prepend new item
            list.unshift({
              _id: schemeData._id,
              schemeName: schemeData.schemeName,
              category: schemeData.category,
              department: schemeData.department,
              state: schemeData.state,
            });
            // Keep top 6
            localStorage.setItem(
              'sarkarisetu_recently_viewed',
              JSON.stringify(list.slice(0, 6))
            );
          } catch (e) {
            console.warn('Failed to update recently viewed list', e);
          }

          // Phase 3: Check if citizen has tracked this scheme in their application pipeline
          if (user) {
            try {
              const appsRes = await getMyApplications({ schemeId: id });
              if (appsRes?.data && appsRes.data.length > 0) {
                const existing = appsRes.data[0];
                setApplicationRecord(existing);
                setTrackerStatus(existing.status);
                setTrackerRef(existing.referenceNumber || '');
                setTrackerNotes(existing.notes || '');
                setTrackerSubDate(
                  existing.submissionDate
                    ? new Date(existing.submissionDate).toISOString().split('T')[0]
                    : ''
                );
              }
            } catch (aErr) {
              console.warn('Failed fetching existing application status', aErr);
            }
          }

          // If user is authenticated, evaluate eligibility for this scheme automatically
          if (user) {
            setCheckingEligibility(true);
            try {
              const eligRes = await checkEligibility(user, schemeData._id);
              if (eligRes?.data) {
                setEligibilityResult(eligRes.data);
              }
            } catch (err) {
              console.warn('Failed auto-evaluating scheme eligibility:', err);
            } finally {
              setCheckingEligibility(false);
            }
          }
        } else {
          setError('Scheme record not found.');
        }
      } catch (err) {
        console.error('Failed to load scheme details:', err);
        setError(err.message || 'Failed to retrieve scheme details from database.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchScheme();
    }
  }, [id, user]);

  const handleSaveTracker = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/schemes/${id}` } } });
      return;
    }
    try {
      setSavingTracker(true);
      const res = await trackApplication({
        schemeId: scheme._id,
        status: trackerStatus,
        referenceNumber: trackerRef,
        notes: trackerNotes,
        submissionDate: trackerSubDate || undefined,
        applicationDate: new Date(),
      });
      if (res?.data) {
        setApplicationRecord(res.data);
      }
      setShowTrackerModal(false);
    } catch (err) {
      alert(`Failed to update application tracker: ${err.message}`);
    } finally {
      setSavingTracker(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/schemes/${id}` } } });
      return;
    }
    try {
      await toggleSaveScheme(scheme._id);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently Updated';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Recently Updated';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <LoadingSpinner text={t('common.loading', 'Fetching verified scheme details...')} />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">{t('schemes.emptyTitle', 'Scheme Not Found')}</h2>
          <p className="text-sm text-slate-500">{error || t('schemes.emptyDesc', 'The requested scheme could not be located.')}</p>
          <div className="pt-2">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gov-blue text-white text-xs font-semibold hover:bg-blue-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('schemeDetails.backLink', 'Back to All Schemes')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSaved = isSchemeSaved(scheme._id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-gov-blue hover:text-blue-900 font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.back', 'Back')}</span>
          </button>
          <span>/</span>
          <Link to="/" className="hover:text-slate-800">
            {t('nav.home', 'Home')}
          </Link>
          <span>/</span>
          <Link to="/schemes" className="hover:text-slate-800">
            {t('nav.allSchemes', 'Schemes')}
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">
            {scheme.schemeName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase 3: Tracker Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login', { state: { from: { pathname: `/schemes/${id}` } } });
                return;
              }
              setShowTrackerModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              applicationRecord
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            <span>{applicationRecord ? `${t('applications.title', 'Track')}: ${applicationRecord.status}` : t('applications.title', 'Track Scheme')}</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isSaved
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('schemeCard.saved', 'Saved to Dashboard')}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t('schemeCard.saveScheme', 'Save Scheme')}</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copied ? 'Link Copied!' : t('common.share', 'Share')}</span>
          </button>
        </div>
      </div>

      {/* Scheme Header Banner */}
      <header className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-gov-blue border border-blue-100">
            <CategoryIcon category={scheme.category} className="w-3.5 h-3.5" />
            {scheme.category}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            {t('schemes.stateFilter', 'State Availability')}: {scheme.state}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
              scheme.verificationStatus === 'Verified'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : scheme.verificationStatus === 'Needs Review'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Verification performed by SarkariSetu administrators against official sources"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {t('schemeDetails.verifiedBadge', 'Verified')}: {scheme.verificationStatus || 'Verified'}
          </span>
          {typeof scheme.viewsCount === 'number' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {scheme.viewsCount + 1} views
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {t('schemeDetails.lastUpdated', 'Last Verified')}: {formatDate(scheme.lastVerifiedAt || scheme.lastUpdated || scheme.updatedAt)}
          </span>
        </div>

        {/* Scheme Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {scheme.schemeName}
        </h1>

        {/* Government Department */}
        <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
          <Building2 className="w-4 h-4 text-gov-blue mt-0.5 flex-shrink-0" />
          <span className="font-medium text-slate-700">
            {t('schemeDetails.departmentLabel', 'Implementing Department')}: <span className="font-normal text-slate-600">{scheme.department}</span>
          </span>
        </div>

        {/* Action Link to Official Portal */}
        {scheme.officialWebsite ? (
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href={scheme.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-bold shadow transition"
            >
              <span>{t('schemeDetails.applyOnlineBtn', 'Visit Official Application Portal')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t('schemes.verifiedSource', 'Verified Government Web Portal')}
            </span>
          </div>
        ) : (
          <div className="pt-2">
            <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Official application portal pending state department publication.
            </span>
          </div>
        )}
      </header>

      {/* Phase 2: Personalized Eligibility Evaluation Card (if user logged in) */}
      {isAuthenticated && eligibilityResult && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gov-blue" />
              <h2 className="text-base font-bold text-slate-900">
                {t('schemeDetails.eligibilityTitle', 'Your Eligibility Evaluation for this Scheme')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  eligibilityResult.matchPercentage >= 75
                    ? 'bg-emerald-100 text-emerald-800'
                    : eligibilityResult.matchPercentage >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {eligibilityResult.matchPercentage}% {t('schemeCard.match', 'Match')} ({eligibilityResult.status})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Matched conditions */}
            <div className="space-y-1.5 bg-white p-4 rounded-xl border border-blue-100">
              <span className="font-bold text-slate-700 block mb-1">{t('recommendations.condsMet', 'Matched Conditions')}:</span>
              {eligibilityResult.matchedConditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{cond}</span>
                </div>
              ))}
            </div>

            {/* Unmet or missing */}
            <div className="space-y-1.5 bg-white p-4 rounded-xl border border-blue-100">
              <span className="font-bold text-slate-700 block mb-1">{t('recommendations.condsUnmet', 'Exceptions / Incomplete')}:</span>
              {eligibilityResult.unmetConditions.length === 0 &&
              eligibilityResult.missingInformation.length === 0 ? (
                <p className="text-emerald-700">{t('recommendations.condsMet', 'All evaluated criteria are satisfied!')}</p>
              ) : (
                <>
                  {eligibilityResult.unmetConditions.map((cond, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{cond}</span>
                    </div>
                  ))}
                  {eligibilityResult.missingInformation.map((info, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-amber-700">
                      <span className="text-[10px] bg-amber-200 px-1 rounded font-bold">INFO</span>
                      <span>{info}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Details Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, Benefits, Application Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* About / Description */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs text-gov-blue">
              {t('schemeDetails.overviewTitle', 'About the Scheme')}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {scheme.description}
            </p>
          </section>

          {/* Benefits Provided */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{t('schemeDetails.benefitsTitle', 'Key Benefits & Entitlements')}</h2>
            </div>

            {scheme.benefits && scheme.benefits.length > 0 ? (
              <ul className="space-y-3">
                {scheme.benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Details available upon inquiry.</p>
            )}
          </section>

          {/* Phase 7: Interactive Smart Document Checklist */}
          <SmartDocumentChecklist scheme={scheme} />

          {/* Phase 7: Verified Application Guidance ("How to Apply") */}
          <ApplicationGuidance scheme={scheme} />
        </div>

        {/* Right Column: Eligibility & Verified Source */}
        <div className="space-y-6">
          {/* Eligibility Criteria */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-blue"></span>
              {t('schemeDetails.eligibilityTitle', 'Eligibility Criteria')}
            </h2>

            {scheme.eligibility && scheme.eligibility.length > 0 ? (
              <ul className="space-y-2.5">
                {scheme.eligibility.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Criteria defined by nodal authority.</p>
            )}

            {/* Quick link to interactive checker */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/eligibility"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:underline"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t('dashboard.customizeInChecker', 'Test your criteria in Eligibility Checker')}</span>
              </Link>
            </div>
          </section>

          {/* Phase 3: Official Source Reference Card */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-gov-blue" />
                {t('schemes.verifiedSource', 'Official Source')}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-gov-blue border border-blue-200">
                {scheme.sourceType || 'Central Ministry'}
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700 block">{t('schemeDetails.departmentLabel', 'Verified Nodal Source')}:</span>
                <span>{scheme.sourceName || scheme.department}</span>
              </div>
              {scheme.sourceURL && (
                <div>
                  <span className="font-semibold text-slate-700 block">Official Reference URL:</span>
                  <a
                    href={scheme.sourceURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-blue hover:underline break-all inline-flex items-center gap-1 font-medium"
                  >
                    <span>{scheme.sourceURL}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>{t('schemeDetails.lastUpdated', 'Last Verified by Admin')}: {formatDate(scheme.lastVerifiedAt || scheme.updatedAt)}</span>
              </div>
            </div>
          </section>

          {/* Official Verification & Statutory Disclaimer Card */}
          <section className="bg-slate-900 text-slate-300 rounded-xl p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('recommendations.officialAdvisory', 'Platform Verification Advisory')}</span>
            </div>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              {t('recommendations.officialAdvisory', 'SarkariSetu is an informational directory. Final eligibility is determined by the relevant government department.')}
            </p>
            {scheme.officialWebsite && (
              <a
                href={scheme.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold pt-1"
              >
                <span>{t('schemeDetails.applyOnlineBtn', 'Launch Official Portal')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </section>
        </div>
      </div>

      {/* Phase 3: Application Tracker Modal */}
      {showTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gov-blue" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {t('applications.title', 'Track Application Status')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTracker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('schemeCard.viewDetails', 'Scheme')}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                  {scheme.schemeName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('tracker.statusLabel', 'Current Application Status')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={trackerStatus}
                  onChange={(e) => setTrackerStatus(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none font-medium"
                >
                  <option value="Interested">{t('tracker.interested')}</option>
                  <option value="Preparing Documents">{t('tracker.preparingDocs')}</option>
                  <option value="Ready to Apply">{t('tracker.readyToApply')}</option>
                  <option value="Application Submitted">{t('tracker.submitted')}</option>
                  <option value="Under Review">{t('tracker.underReview')}</option>
                  <option value="Approved">{t('tracker.approved')}</option>
                  <option value="Rejected">{t('tracker.rejected')}</option>
                  <option value="Saved">{t('tracker.saved')}</option>
                  <option value="Applied">{t('tracker.applied')}</option>
                  <option value="Completed">{t('tracker.completed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('tracker.submissionDateLabel')}
                </label>
                <input
                  type="date"
                  value={trackerSubDate}
                  onChange={(e) => setTrackerSubDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('tracker.refNumberLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('tracker.refNumberPlaceholder')}
                  value={trackerRef}
                  onChange={(e) => setTrackerRef(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('tracker.notesLabel')}
                </label>
                <textarea
                  rows="3"
                  placeholder={t('tracker.notesPlaceholder')}
                  value={trackerNotes}
                  onChange={(e) => setTrackerNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-tight">
                <strong>{t('recommendations.badge', 'Citizen Notice')}:</strong> Tracking status here is for your personal records within SarkariSetu. It does not replace submission on the official government portal.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrackerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingTracker}
                  className="px-5 py-2 text-xs font-bold text-white bg-gov-blue hover:bg-blue-900 rounded-lg shadow disabled:opacity-50"
                >
                  {savingTracker ? t('common.loading', 'Saving...') : t('common.submit', 'Save Tracking')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeDetailsPage;
