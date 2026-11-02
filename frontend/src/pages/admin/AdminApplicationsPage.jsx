import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Bookmark,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { getAdminApplications } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdminApplications();
        if (res?.data) {
          setApplications(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load applications log.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
          Citizen Activity Logs
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application Tracking & Citizen Interest
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track citizen engagement stages (Saved, Interested, Applied, Completed) across all government schemes.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Fetching application tracking activity from MongoDB..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-xs">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm text-xs text-slate-500">
          No citizen application tracking records logged yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Target Scheme</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Application Reference</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{app.user?.name}</div>
                      <div className="text-[11px] text-slate-500">{app.user?.email}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 line-clamp-1">
                        {app.scheme?.schemeName || 'Unknown Scheme'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {app.scheme?.category}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          app.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : app.status === 'Applied'
                            ? 'bg-blue-50 text-gov-blue border border-blue-300'
                            : app.status === 'Interested'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {app.referenceNumber || '—'}
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-600 line-clamp-2">
                      {app.notes || 'No notes added'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(app.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicationsPage;
