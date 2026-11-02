import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { getAdminStats, getAdminAnalytics } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, analyticsRes] = await Promise.all([
          getAdminStats(),
          getAdminAnalytics(),
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
        setError(err.message || 'Error communicating with MongoDB backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Computing real-time MongoDB analytics..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-base">Error Loading Admin Statistics</h3>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const maxCategoryCount = analytics?.schemesByCategory?.length
    ? Math.max(...analytics.schemesByCategory.map((c) => c.count))
    : 1;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            System Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Overview & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time aggregate data queried directly from the local MongoDB <code className="text-gov-blue font-semibold">sarkarisetu</code> database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/schemes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addNewScheme')}</span>
          </Link>
        </div>
      </div>

      {/* Top Stat Cards (Real MongoDB Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registered Citizens */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.totalUsers')}</span>
            <Users className="w-4 h-4 text-gov-blue" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalCitizens.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">
            Active verified citizen accounts
          </div>
        </div>

        {/* Total Schemes & Active Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.totalSchemes')}</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalSchemes.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 font-bold">
              {stats.activeSchemes} {t('admin.activeSchemes')}
            </span>
            <span>•</span>
            <span className="text-amber-700 font-medium">
              {stats.underReviewSchemes} Under Review
            </span>
            {stats.inactiveSchemes > 0 && (
              <>
                <span>•</span>
                <span className="text-slate-400">{stats.inactiveSchemes} Inactive</span>
              </>
            )}
          </div>
        </div>

        {/* Total Views Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Scheme Views</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalViews.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400">
            Citizen discovery interactions tracked
          </div>
        </div>

        {/* Applications / Interests Tracked */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t('admin.totalApplications')}</span>
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalApplications.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            Personal status records & {stats.totalSaved} bookmarks
          </div>
        </div>
      </div>

      {/* Two-Column Section: Category Distribution & State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schemes by Category Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-blue" />
              <h3 className="font-bold text-sm text-slate-900">Schemes by Welfare Category</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {analytics?.schemesByCategory?.length || 0} Categories
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics?.schemesByCategory?.slice(0, 7).map((item) => {
              const widthPct = Math.round((item.count / maxCategoryCount) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-gov-blue">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gov-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(widthPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schemes by State Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gov-blue" />
              <h3 className="font-bold text-sm text-slate-900">Geographic Jurisdiction</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Central vs State Schemes
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {analytics?.schemesByState?.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between"
              >
                <div className="text-xs font-bold text-slate-800 truncate mr-2">
                  {item.name}
                </div>
                <div className="text-xs font-extrabold text-gov-blue px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Most Viewed & Most Saved Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Viewed Schemes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Most Viewed Schemes</h3>
            </div>
            <Link to="/admin/schemes" className="text-xs font-bold text-gov-blue hover:underline">
              View Catalog
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.mostViewedSchemes?.slice(0, 5).map((scheme, idx) => (
              <div
                key={scheme._id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/60"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {scheme.schemeName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {scheme.category} • {scheme.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-indigo-700 block">
                    {scheme.viewsCount.toLocaleString('en-IN')} views
                  </span>
                  <span className="text-[10px] text-slate-400 block">Rank #{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Saved / Bookmarked Schemes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
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
              <p className="text-xs text-slate-400 py-6 text-center">
                No bookmark analytics recorded yet.
              </p>
            ) : (
              analytics?.mostSavedSchemes?.slice(0, 5).map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/60"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {item.schemeName}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {item.category} • {item.state}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-700 block">
                      {item.savedCount} Citizens
                    </span>
                    <span className="text-[10px] text-slate-400 block">Saved</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
