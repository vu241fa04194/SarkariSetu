import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  FileText,
  Bookmark,
  Eye,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Download,
  ExternalLink,
  Filter,
  Search,
  Activity,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  Info,
  Calendar,
  Building2,
  Edit2,
  SlidersHorizontal,
  Server,
  Lock,
} from 'lucide-react';
import {
  getAdminStats,
  getAdminAnalytics,
  getSchemes,
  getAdminApplications,
  getAdminAuditLogs,
  updateSchemeVerification,
  updateSchemeStatus,
} from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AdminDashboardPage = () => {
  const { t } = useTranslation();

  // Core Data States
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');
  const [activeTab, setActiveTab] = useState('category'); // 'category' | 'state'
  const [categorySearch, setCategorySearch] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Fetch all dashboard data concurrently
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [statsRes, analyticsRes, schemesRes, appsRes, auditRes] =
        await Promise.all([
          getAdminStats(),
          getAdminAnalytics(),
          getSchemes({ allStatus: 'true' }),
          getAdminApplications(),
          getAdminAuditLogs({ limit: 6 }),
        ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      if (schemesRes?.data) setSchemes(schemesRes.data);
      if (appsRes?.data) setRecentApplications(appsRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err.message || 'Error communicating with MongoDB backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Clear success notice after 5 seconds
  useEffect(() => {
    if (successNotice) {
      const timer = setTimeout(() => setSuccessNotice(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotice]);

  // Handler: Quick Verify Scheme from Review Queue
  const handleQuickVerify = async (schemeId, schemeName) => {
    try {
      setActionInProgress(`verify-${schemeId}`);
      await updateSchemeVerification(schemeId, 'Verified');

      // Update scheme in local state
      setSchemes((prev) =>
        prev.map((s) =>
          s._id === schemeId
            ? {
                ...s,
                verificationStatus: 'Verified',
                verifiedAt: new Date().toISOString(),
              }
            : s
        )
      );

      // Update stats counts
      setStats((prev) =>
        prev ? { ...prev, verifiedSchemes: (prev.verifiedSchemes || 0) + 1 } : prev
      );

      setSuccessNotice(
        `"${schemeName}" has been successfully marked as Verified against official gazette sources.`
      );

      // Re-fetch audit logs to show latest entry
      const auditRes = await getAdminAuditLogs({ limit: 6 });
      if (auditRes?.data) setAuditLogs(auditRes.data);
    } catch (err) {
      alert(`Failed to verify scheme: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler: Quick Status Change from Review Queue
  const handleQuickStatusChange = async (schemeId, newStatus, schemeName) => {
    try {
      setActionInProgress(`status-${schemeId}`);
      await updateSchemeStatus(schemeId, newStatus);

      // Update scheme in local state
      setSchemes((prev) =>
        prev.map((s) => (s._id === schemeId ? { ...s, status: newStatus } : s))
      );

      setSuccessNotice(`Catalog status for "${schemeName}" updated to ${newStatus}.`);

      // Refresh stats and audit logs
      const [statsRes, auditRes] = await Promise.all([
        getAdminStats(),
        getAdminAuditLogs({ limit: 6 }),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Export Data Utilities
  const exportExecutiveSummaryCSV = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value'],
      ['Platform', 'SarkariSetu - National Welfare Discovery Engine'],
      ['Export Date (IST)', new Date().toLocaleString('en-IN')],
      ['Total Registered Users', stats.totalUsers || 0],
      ['Total Citizens', stats.totalCitizens || 0],
      ['Total Administrators', stats.totalAdmins || 0],
      ['Total Schemes in Catalog', stats.totalSchemes || 0],
      ['Active Schemes', stats.activeSchemes || 0],
      ['Under Review Schemes', stats.underReviewSchemes || 0],
      ['Inactive Schemes', stats.inactiveSchemes || 0],
      ['Verified Official Schemes', stats.verifiedSchemes || 0],
      ['Total Scheme Views', stats.totalViews || 0],
      ['Total Application Tracking Records', stats.totalApplications || 0],
      ['Total Citizen Bookmarks (Saved)', stats.totalSaved || 0],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    downloadFile(
      csvContent,
      `SarkariSetu_Executive_Summary_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const exportSchemesCatalogCSV = () => {
    if (!schemes.length) return;
    const headers = [
      'Scheme Name',
      'Category',
      'Department',
      'Jurisdiction State',
      'Status',
      'Verification Status',
      'Views Count',
      'Official Website',
    ];

    const rows = schemes.map((s) => [
      s.schemeName,
      s.category,
      s.department,
      s.state || 'All India',
      s.status,
      s.verificationStatus || 'Pending Verification',
      s.viewsCount || 0,
      s.officialWebsite || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadFile(
      csvContent,
      `SarkariSetu_Schemes_Catalog_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const exportFullReportJSON = () => {
    const reportData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'SarkariSetu',
      version: '2.4 Production',
      stats,
      analytics,
      schemesCount: schemes.length,
      auditLogsPreview: auditLogs.slice(0, 10),
    };

    const jsonString =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(reportData, null, 2));
    downloadFile(
      jsonString,
      `SarkariSetu_System_Report_${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const downloadFile = (uri, filename) => {
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Computing real-time MongoDB analytics & pipeline aggregates..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center space-y-4 max-w-xl mx-auto shadow-sm">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-base">Error Loading Admin Dashboard</h3>
        <p className="text-xs text-red-600 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchDashboardData(false)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Filter schemes needing review: Pending Verification, Needs Review, or Under Review
  const pendingReviewSchemes = schemes.filter(
    (s) =>
      s.verificationStatus === 'Pending Verification' ||
      s.verificationStatus === 'Needs Review' ||
      s.status === 'Under Review'
  );

  // Application Pipeline Stages Breakdown
  const appStatusMap = (analytics?.applicationStatusDistribution || []).reduce(
    (acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    },
    {}
  );
  const totalAppsCount = stats.totalApplications || 0;
  const stageSaved = appStatusMap['Saved'] || 0;
  const stageInterested = appStatusMap['Interested'] || 0;
  const stageApplied = appStatusMap['Applied'] || 0;
  const stageCompleted = appStatusMap['Completed'] || 0;

  // Max category count for progress bars
  const maxCategoryCount = analytics?.schemesByCategory?.length
    ? Math.max(...analytics.schemesByCategory.map((c) => c.count))
    : 1;

  // Filtered categories for category tab
  const filteredCategories = (analytics?.schemesByCategory || []).filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const verificationPercentage = Math.round(
    ((stats.verifiedSchemes || 0) / (stats.totalSchemes || 1)) * 100
  );

  return (
    <div className="space-y-8">
      {/* Toast Notification Alert */}
      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header & Command Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-blue mb-1.5">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Digital Public Infrastructure • Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('admin.dashboard', 'Administrative Overview & Platform Metrics')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Live telemetry and operational metrics aggregated directly from the MongoDB cluster{' '}
            <code className="text-gov-blue font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
              sarkarisetu
            </code>
            .
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Refresh All Aggregations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gov-blue' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>

          <Link
            to="/admin/schemes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addNewScheme', 'Add New Scheme')}</span>
          </Link>
        </div>
      </div>

      {/* System Technical Architecture & Security Health Banner */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">API Gateway:</span>
            <span className="font-bold text-white">Express 4 / Port 5000</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Database:</span>
            <span className="font-bold text-white">MongoDB Local</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Protection:</span>
            <span className="font-semibold text-slate-300">Helmet 8 • Rate Limit (1000/15m)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] self-end md:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Top Stat Cards (5 Executive KPI Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Registered Citizens */}
        <Link
          to="/admin/users"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-gov-blue/50 transition group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('admin.totalUsers', 'Registered Citizens')}
            </span>
            <Users className="w-4 h-4 text-gov-blue group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalCitizens.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{stats.totalAdmins} authorized admins</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-gov-blue" />
          </div>
        </Link>

        {/* Card 2: Government Scheme Catalog */}
        <Link
          to="/admin/schemes"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-emerald-400 transition group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('admin.totalSchemes', 'Total Schemes')}
            </span>
            <FileText className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalSchemes.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-700 font-bold">{stats.activeSchemes} Active</span>
            <span>•</span>
            <span className="text-amber-700 font-medium">
              {stats.underReviewSchemes} Review
            </span>
            {stats.inactiveSchemes > 0 && (
              <>
                <span>•</span>
                <span className="text-slate-400">{stats.inactiveSchemes} Inactive</span>
              </>
            )}
          </div>
        </Link>

        {/* Card 3: Official Verification Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Verification Health</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.verifiedSchemes || 0}{' '}
            <span className="text-sm font-semibold text-slate-400">
              / {stats.totalSchemes}
            </span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${verificationPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>{verificationPercentage}% Verified</span>
              <span>{pendingReviewSchemes.length} need attention</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Scheme Views */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Citizen Views</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalViews.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">
            Avg ~{Math.round(stats.totalViews / (stats.totalSchemes || 1))} views / program
          </div>
        </div>

        {/* Card 5: Application Tracking & Bookmarks */}
        <Link
          to="/admin/applications"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-amber-400 transition group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('admin.totalApplications', 'Application Pipeline')}
            </span>
            <ClipboardList className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalApplications.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>{stats.totalSaved.toLocaleString('en-IN')} saved bookmarks</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600" />
          </div>
        </Link>
      </div>

      {/* Citizen Application Progression Funnel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gov-blue" />
              <span>Citizen Application & Lifecycle Funnel</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking metrics showing citizen progression from scheme discovery to benefit sanction.
            </p>
          </div>
          <Link
            to="/admin/applications"
            className="text-xs font-bold text-gov-blue hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Tracker Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Saved */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider">Stage 1: Saved</span>
              <Bookmark className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stageSaved}</div>
            <div className="text-[11px] text-slate-500">Bookmarked for later review</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-slate-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.round((stageSaved / (totalAppsCount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Step 2: Interested */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span className="font-bold uppercase tracking-wider">Stage 2: Interested</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">{stageInterested}</div>
            <div className="text-[11px] text-amber-700">Gathering requirements & documents</div>
            <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-600 h-1.5 rounded-full"
                style={{
                  width: `${Math.round((stageInterested / (totalAppsCount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Step 3: Applied */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-gov-blue">
              <span className="font-bold uppercase tracking-wider">Stage 3: Applied</span>
              <FileText className="w-4 h-4 text-gov-blue" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stageApplied}</div>
            <div className="text-[11px] text-blue-700">Submitted on official departmental portal</div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-gov-blue h-1.5 rounded-full"
                style={{
                  width: `${Math.round((stageApplied / (totalAppsCount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Step 4: Completed */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span className="font-bold uppercase tracking-wider">Stage 4: Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-950">{stageCompleted}</div>
            <div className="text-[11px] text-emerald-700">Benefits sanctioned / cycle completed</div>
            <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{
                  width: `${Math.round((stageCompleted / (totalAppsCount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Review & Verification Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900">
                Scheme Verification & Quality Review Queue
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Schemes flagged for gazette verification or review before citizen publication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
              {pendingReviewSchemes.length} In Queue
            </span>
            <Link
              to="/admin/schemes"
              className="text-xs font-bold text-gov-blue hover:underline ml-2"
            >
              Full Catalog
            </Link>
          </div>
        </div>

        {pendingReviewSchemes.length === 0 ? (
          <div className="p-8 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-sm text-emerald-900">
              All Schemes Verified Against Official Gazettes!
            </h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              Every scheme in the catalog currently holds verified status and has been authenticated with official ministry sources.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Scheme Name & Ministry</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Jurisdiction</th>
                  <th className="py-3 px-3">Verification Badge</th>
                  <th className="py-3 px-3">Catalog Status</th>
                  <th className="py-3 px-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReviewSchemes.slice(0, 6).map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {scheme.schemeName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {scheme.department}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{scheme.category}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {scheme.state || 'All India'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          scheme.verificationStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : scheme.verificationStatus === 'Needs Review'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {scheme.verificationStatus || 'Pending Verification'}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          scheme.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scheme.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scheme.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickVerify(scheme._id, scheme.schemeName)}
                          disabled={actionInProgress === `verify-${scheme._id}`}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                          title="Mark as Verified against official source"
                        >
                          Verify
                        </button>

                        {scheme.status === 'Under Review' ? (
                          <button
                            onClick={() =>
                              handleQuickStatusChange(scheme._id, 'Active', scheme.schemeName)
                            }
                            disabled={actionInProgress === `status-${scheme._id}`}
                            className="px-2.5 py-1 bg-gov-blue hover:bg-blue-900 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleQuickStatusChange(
                                scheme._id,
                                'Under Review',
                                scheme.schemeName
                              )
                            }
                            disabled={actionInProgress === `status-${scheme._id}`}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            Review
                          </button>
                        )}

                        <Link
                          to={`/admin/schemes/${scheme._id}/edit`}
                          className="p-1 text-slate-400 hover:text-gov-blue transition"
                          title="Edit Scheme Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Welfare Distribution Analytics: Category Breakdown & State Jurisdiction */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-blue" />
              <span>Welfare Sectoral & Geographic Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of public welfare schemes cataloged across sectors and geographic boundaries.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('category')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'category'
                  ? 'bg-white text-gov-blue shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Welfare Categories ({analytics?.schemesByCategory?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('state')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'state'
                  ? 'bg-white text-gov-blue shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Geographic Coverage ({analytics?.schemesByState?.length || 0})
            </button>
          </div>
        </div>

        {activeTab === 'category' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filter category..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
                />
              </div>
              <span className="text-xs text-slate-400">
                Showing {filteredCategories.length} categories
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {filteredCategories.map((item) => {
                const widthPct = Math.round((item.count / maxCategoryCount) * 100);
                const shareOfTotal = Math.round(
                  (item.count / (stats.totalSchemes || 1)) * 100
                );
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate mr-2">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">({shareOfTotal}%)</span>
                        <span className="font-extrabold text-gov-blue w-6 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gov-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(widthPct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {analytics?.schemesByState?.map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100 transition"
                >
                  <div className="space-y-0.5 truncate mr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.name === 'All India' ? 'Central Scheme' : 'State Scheme'}
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-gov-blue px-2.5 py-1 rounded-full bg-white border border-slate-200 flex-shrink-0">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Section: Most Viewed & Most Bookmarked Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Viewed Schemes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Most Viewed Citizen Programs</h3>
            </div>
            <Link to="/admin/schemes" className="text-xs font-bold text-gov-blue hover:underline">
              View Catalog
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.mostViewedSchemes?.slice(0, 5).map((scheme, idx) => (
              <div
                key={scheme._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {scheme.schemeName}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {scheme.department} • {scheme.category}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-extrabold text-purple-700 block">
                    {scheme.viewsCount.toLocaleString('en-IN')} views
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Rank #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Saved / Bookmarked Schemes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Top Bookmarked Schemes</h3>
            </div>
            <Link
              to="/admin/applications"
              className="text-xs font-bold text-gov-blue hover:underline"
            >
              View Activity
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.mostSavedSchemes?.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No bookmark analytics recorded yet.
              </p>
            ) : (
              analytics?.mostSavedSchemes?.slice(0, 5).map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {item.schemeName}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {item.category} • {item.state || 'All India'}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-amber-700 block">
                      {item.savedCount} Citizens
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Rank #{idx + 1}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Recent Citizen Activity & Administrative Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Citizen Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gov-blue" />
              <h3 className="font-bold text-sm text-slate-900">
                Recent Citizen Application Activity
              </h3>
            </div>
            <Link
              to="/admin/applications"
              className="text-xs font-bold text-gov-blue hover:underline"
            >
              View All ({recentApplications.length})
            </Link>
          </div>

          <div className="space-y-3">
            {recentApplications.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No application activity records logged yet.
              </p>
            ) : (
              recentApplications.slice(0, 5).map((app) => (
                <div
                  key={app._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 max-w-[65%]">
                    <div className="font-bold text-slate-900 truncate">
                      {app.user?.name || 'Citizen'}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {app.scheme?.schemeName || 'Unknown Scheme'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {app.user?.state || 'State not set'}
                      {app.referenceNumber ? ` • Ref: ${app.referenceNumber}` : ''}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Applied'
                          ? 'bg-blue-100 text-gov-blue'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(app.updatedAt || app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Administrative Audit Trail Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Administrative Audit Trail</h3>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-bold text-gov-blue hover:underline"
            >
              Full Security Log
            </Link>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No recent administrative actions recorded.
              </p>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="truncate">{log.adminEmail}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {log.details?.schemeName || `${log.targetModel} modification`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      IP: {log.ipAddress || 'Internal'}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                      {log.action?.replace('_', ' ')}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Export Platform Report Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gov-blue" />
                <h3 className="font-bold text-base text-slate-900">Export Platform Report</h3>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generate standardized data exports for compliance, state ministry reports, or database auditing.
            </p>

            <div className="space-y-3">
              <button
                onClick={exportExecutiveSummaryCSV}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-gov-blue hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-gov-blue">
                    Executive Summary (CSV)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Key performance metrics, user counts, and catalog stats.
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-gov-blue" />
              </button>

              <button
                onClick={exportSchemesCatalogCSV}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-gov-blue hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-gov-blue">
                    Complete Scheme Catalog (CSV)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    All {schemes.length} schemes with status, ministry, and views count.
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-gov-blue" />
              </button>

              <button
                onClick={exportFullReportJSON}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-gov-blue hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-gov-blue">
                    Complete System Overview (JSON)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Full aggregation dump, category distributions, and audit trails.
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-gov-blue" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
