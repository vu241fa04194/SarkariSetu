import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Layers,
  Eye,
  Bookmark,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { getAdminAnalytics, getAdminStats } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const [aRes, sRes] = await Promise.all([
          getAdminAnalytics(),
          getAdminStats(),
        ]);
        if (aRes?.data) setAnalytics(aRes.data);
        if (sRes?.data) setStats(sRes.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch MongoDB analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Computing MongoDB aggregation pipelines..." />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-xs">
        {error || 'Error loading analytics.'}
      </div>
    );
  }

  const maxCat = analytics.schemesByCategory?.length
    ? Math.max(...analytics.schemesByCategory.map((c) => c.count))
    : 1;

  const maxViews = analytics.mostViewedSchemes?.length
    ? Math.max(...analytics.mostViewedSchemes.map((s) => s.viewsCount))
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
          Database Aggregations & Metrics
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Analytics & Public Good Impact
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed metrics generated exclusively from MongoDB database records in the <code className="text-gov-blue font-semibold">sarkarisetu</code> cluster.
        </p>
      </div>

      {/* Grid: Categories & States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-blue" />
              <span>Schemes Distribution by Category</span>
            </h3>
            <span className="text-xs font-bold text-gov-blue">{analytics.schemesByCategory.length} Sectors</span>
          </div>

          <div className="space-y-3">
            {analytics.schemesByCategory.map((cat) => {
              const pct = Math.round((cat.count / maxCat) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="font-bold text-gov-blue">{cat.count} Schemes</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gov-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Schemes Distribution by State Jurisdiction</span>
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.schemesByState.map((st) => (
              <div
                key={st.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/60"
              >
                <span className="text-xs font-bold text-slate-800">{st.name}</span>
                <span className="text-xs font-extrabold text-emerald-700 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  {st.count} Schemes
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Most Viewed & Most Saved Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Viewed Schemes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Most Viewed Schemes (Traffic Metrics)</span>
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.mostViewedSchemes.map((s) => {
              const pct = Math.round((s.viewsCount / maxViews) * 100);
              return (
                <div key={s._id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[70%]">
                      {s.schemeName}
                    </span>
                    <span className="font-extrabold text-indigo-700">
                      {s.viewsCount.toLocaleString('en-IN')} views
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Application Status Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Citizen Application Engagement Funnel</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {analytics.applicationStatusDistribution.map((item) => (
              <div
                key={item.status}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1"
              >
                <div className="text-2xl font-extrabold text-slate-900">{item.count}</div>
                <div className="text-xs font-bold text-slate-600">{item.status}</div>
                <div className="text-[10px] text-slate-400">Citizen Records</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
