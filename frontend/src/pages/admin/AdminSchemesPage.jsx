import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  getSchemes,
  deleteScheme,
  updateSchemeStatus,
  updateSchemeVerification,
} from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AdminSchemesPage = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');

  const fetchAllSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass allStatus=true so backend returns Inactive and Under Review schemes as well
      const res = await getSchemes({ allStatus: 'true' });
      if (res?.data) {
        setSchemes(res.data);
      }
    } catch (err) {
      console.error('Failed to load schemes for admin:', err);
      setError(err.message || 'Failed to fetch schemes catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSchemes();
  }, []);

  const handleStatusChange = async (schemeId, newStatus) => {
    try {
      await updateSchemeStatus(schemeId, newStatus);
      setSchemes((prev) =>
        prev.map((s) => (s._id === schemeId ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      alert(`Error updating scheme status: ${err.message}`);
    }
  };

  const handleVerificationChange = async (schemeId, newVerification) => {
    try {
      await updateSchemeVerification(schemeId, newVerification);
      setSchemes((prev) =>
        prev.map((s) =>
          s._id === schemeId ? { ...s, verificationStatus: newVerification } : s
        )
      );
    } catch (err) {
      alert(`Error updating verification status: ${err.message}`);
    }
  };

  const handleDelete = async (schemeId, schemeName) => {
    if (!window.confirm(`Are you sure you want to delete "${schemeName}" permanently?`)) {
      return;
    }
    try {
      await deleteScheme(schemeId);
      setSchemes((prev) => prev.filter((s) => s._id !== schemeId));
    } catch (err) {
      alert(`Failed to delete scheme: ${err.message}`);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchSearch =
      !search ||
      s.schemeName.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchVerif =
      verificationFilter === 'All' || s.verificationStatus === verificationFilter;

    return matchSearch && matchStatus && matchVerif;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            Scheme Catalog Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Government Schemes Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Add, edit, verify sources, and manage deployment status across all {schemes.length} schemes.
          </p>
        </div>

        <Link
          to="/admin/schemes/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scheme</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scheme name, department..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-gov-blue focus:bg-white"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-gov-blue"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-gov-blue"
          >
            <option value="All">All Verifications</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Needs Review">Needs Review</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      {loading ? (
        <LoadingSpinner text="Fetching schemes from database..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-xs">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Scheme Name & Category</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Admin Verification</th>
                  <th className="py-3.5 px-4">Views</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchemes.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {scheme.schemeName}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {scheme.category} • {scheme.department}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-[11px]">
                        {scheme.state}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={scheme.status}
                        onChange={(e) => handleStatusChange(scheme._id, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                          scheme.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : scheme.status === 'Under Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={scheme.verificationStatus || 'Pending Verification'}
                        onChange={(e) =>
                          handleVerificationChange(scheme._id, e.target.value)
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                          scheme.verificationStatus === 'Verified'
                            ? 'bg-blue-50 text-gov-blue border-blue-300'
                            : scheme.verificationStatus === 'Needs Review'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Verified">Verified</option>
                        <option value="Pending Verification">Pending Verification</option>
                        <option value="Needs Review">Needs Review</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-600">
                      {scheme.viewsCount || 0}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        to={`/schemes/${scheme._id}`}
                        target="_blank"
                        className="inline-flex items-center text-slate-400 hover:text-slate-600 p-1"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/admin/schemes/${scheme._id}/edit`}
                        className="inline-flex items-center text-gov-blue hover:text-blue-900 p-1"
                        title="Edit Scheme"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(scheme._id, scheme.schemeName)}
                        className="inline-flex items-center text-red-500 hover:text-red-700 p-1"
                        title="Delete Scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default AdminSchemesPage;
