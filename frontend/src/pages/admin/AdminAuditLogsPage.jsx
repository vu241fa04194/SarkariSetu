import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { getAdminAuditLogs } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const ACTION_CONFIG = {
  CREATE_SCHEME: {
    label: 'Create Scheme',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  UPDATE_SCHEME: {
    label: 'Update Scheme',
    color: 'bg-blue-50 text-gov-blue border-blue-200',
    icon: Activity,
  },
  DELETE_SCHEME: {
    label: 'Delete Scheme',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: ShieldAlert,
  },
  VERIFY_SCHEME: {
    label: 'Verify Scheme',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: ShieldCheck,
  },
  UPDATE_SCHEME_STATUS: {
    label: 'Status Change',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Activity,
  },
  UPDATE_USER_ROLE: {
    label: 'Role Change',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: User,
  },
  SECURITY_CONFIG_UPDATE: {
    label: 'Security Update',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ShieldAlert,
  },
  DOCUMENT_ACCESS: {
    label: 'Doc Access',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: FileText,
  },
};

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: targetPage,
        limit: 20,
      };
      if (actionFilter && actionFilter !== 'All') {
        params.action = actionFilter;
      }

      const res = await getAdminAuditLogs(params);
      if (res?.data) {
        setLogs(res.data);
        setPage(res.page || targetPage);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || res.data.length);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to retrieve administrative audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleRefresh = () => {
    fetchLogs(page);
  };

  // Filter logs locally by search term (admin email, target ID, targetModel)
  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.adminEmail?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.targetModel?.toLowerCase().includes(q) ||
      log.targetId?.toLowerCase().includes(q) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(q)
    );
  });

  const exportLogsAsCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Admin Email', 'Action', 'Target Model', 'Target ID', 'IP Address', 'Details'];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      `"${log.adminEmail || ''}"`,
      `"${log.action || ''}"`,
      `"${log.targetModel || ''}"`,
      `"${log.targetId || ''}"`,
      `"${log.ipAddress || ''}"`,
      `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SarkariSetu_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security Compliance & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable tracking records of all administrative modifications, scheme verifications, status updates, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportLogsAsCSV}
            disabled={!logs.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-bold shadow transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action, scheme..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-gov-blue focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none w-full md:w-auto"
            >
              <option value="All">All Audit Actions</option>
              <option value="VERIFY_SCHEME">Verification Updates</option>
              <option value="UPDATE_SCHEME_STATUS">Status Changes</option>
              <option value="CREATE_SCHEME">New Schemes Created</option>
              <option value="UPDATE_SCHEME">Scheme Edits</option>
              <option value="DELETE_SCHEME">Scheme Deletions</option>
              <option value="UPDATE_USER_ROLE">User Role Updates</option>
              <option value="SECURITY_CONFIG_UPDATE">Security Config Updates</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">
            Total: <strong className="text-slate-700">{totalCount}</strong> logs
          </span>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <LoadingSpinner text="Retrieving administrative audit trail..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
          <p className="font-semibold text-xs">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-xs font-bold text-gov-blue underline mt-2 inline-block"
          >
            Try Again
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No Audit Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || actionFilter !== 'All'
              ? 'No audit entries match the selected filters. Try clearing your search.'
              : 'Administrative actions such as scheme verifications, edits, and deletions will be automatically logged here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                  <th className="py-3.5 px-4">Network / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionMeta = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: 'bg-slate-100 text-slate-800 border-slate-200',
                    icon: Activity,
                  };
                  const Icon = actionMeta.icon;

                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-5">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.adminEmail}</div>
                        <div className="text-[10px] text-amber-600 font-semibold uppercase">
                          Authorized Administrator
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${actionMeta.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{actionMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{log.targetModel}</div>
                        {log.details?.schemeName && (
                          <div className="text-[11px] text-gov-blue font-medium truncate max-w-xs">
                            {log.details.schemeName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          ID: {log.targetId || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-[11px] font-bold text-gov-blue hover:underline bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded border border-slate-200 transition"
                        >
                          View Context Payload
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                        {log.ipAddress || 'Internal Loopback'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page <strong className="text-slate-900">{page}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gov-blue" />
                <h3 className="font-bold text-sm text-slate-900">Audit Log Event Payload</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Action:</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Admin:</span>
                <span className="font-bold text-slate-900">{selectedLog.adminEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Target Entity:</span>
                <span className="font-bold text-slate-900">
                  {selectedLog.targetModel} ({selectedLog.targetId})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Timestamp:</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">IP Address:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress || 'Internal'}</span>
              </div>
              {selectedLog.userAgent && (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold block mb-0.5">User Agent:</span>
                  <span className="font-mono text-[10px] text-slate-600 break-all block">
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 block">Context Payload (JSON):</span>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gov-blue hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition"
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

export default AdminAuditLogsPage;
