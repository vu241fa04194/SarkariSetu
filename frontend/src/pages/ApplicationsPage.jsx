import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Bookmark,
  Calendar,
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
  Plus,
  ShieldAlert,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  getMyApplications,
  updateApplication,
  deleteApplication,
  trackApplication,
  getSchemes,
} from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ApplicationsPage = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  // Edit Modal State
  const [editingApp, setEditingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: 'Interested',
    applicationDate: '',
    submissionDate: '',
    referenceNumber: '',
    notes: '',
  });

  // Track New Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableSchemes, setAvailableSchemes] = useState([]);
  const [newSchemeId, setNewSchemeId] = useState('');
  const [newStatus, setNewStatus] = useState('Interested');
  const [newNotes, setNewNotes] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyApplications();
      if (res?.data) {
        setApplications(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve application tracking records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await getSchemes();
      if (res?.data) {
        setAvailableSchemes(res.data);
        if (res.data.length > 0) setNewSchemeId(res.data[0]._id);
      }
    } catch (e) {
      console.warn('Failed to load schemes for add tracking modal', e);
    }
  };

  const handleAddNewTracking = async (e) => {
    e.preventDefault();
    if (!newSchemeId) return;

    try {
      await trackApplication({
        schemeId: newSchemeId,
        status: newStatus,
        notes: newNotes,
        applicationDate: new Date(),
      });
      setShowAddModal(false);
      setNewNotes('');
      fetchApplications();
    } catch (err) {
      alert(`Error tracking scheme: ${err.message}`);
    }
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setEditFormData({
      status: app.status || 'Interested',
      applicationDate: app.applicationDate
        ? new Date(app.applicationDate).toISOString().split('T')[0]
        : '',
      submissionDate: app.submissionDate
        ? new Date(app.submissionDate).toISOString().split('T')[0]
        : '',
      referenceNumber: app.referenceNumber || '',
      notes: app.notes || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingApp) return;

    try {
      await updateApplication(editingApp._id, editFormData);
      setEditingApp(null);
      fetchApplications();
    } catch (err) {
      alert(`Error updating tracking: ${err.message}`);
    }
  };

  const handleDelete = async (id, schemeName) => {
    if (!window.confirm(`Stop tracking "${schemeName}"?`)) return;

    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(`Error untracking scheme: ${err.message}`);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'All') return true;
    return app.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            {t('applications.title', 'Citizen Assistance Portal')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('applications.title', 'Personal Application Tracker')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('applications.subtitle', 'Organize your government scheme document submissions, application reference numbers, and stages.')}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('applications.trackNewBtn', 'Track A Scheme')}</span>
        </button>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">{t('recommendations.badge', 'Personal Tracking Notice')}:</strong> {t('recommendations.officialAdvisory', 'SarkariSetu provides this tracker for your personal record keeping. Always submit your applications and verify requirements on the respective official government portals.')}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700">
          {t('recommendations.showing', { count: applications.length, total: applications.length, defaultValue: `Tracking ${applications.length} Scheme Applications` })}
        </span>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            'All',
            'Interested',
            'Preparing Documents',
            'Ready to Apply',
            'Application Submitted',
            'Under Review',
            'Approved',
            'Rejected',
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md font-semibold transition text-[11px] sm:text-xs ${
                activeTab === tab
                  ? 'bg-white text-gov-blue shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'All' ? t('recommendations.tabs.all', 'All') : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <LoadingSpinner text={t('common.loading', 'Retrieving your personal application records...')} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-xs">
          {error}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('applications.noApps', 'You are not tracking any applications yet.')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t('applications.subtitle', 'Click "Track A Scheme" above or browse schemes to record your application progress, reference IDs, and submission notes.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApplications.map((app) => {
            const scheme = app.scheme;
            if (!scheme) return null;

            return (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div>
                  {/* Top Bar: Category + Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-gov-blue">
                      {scheme.category}
                    </span>

                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        app.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : app.status === 'Applied'
                          ? 'bg-blue-50 text-gov-blue border border-blue-300'
                          : app.status === 'Interested'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {t('common.status', 'Status')}: {app.status}
                    </span>
                  </div>

                  {/* Scheme Title */}
                  <h3 className="text-base font-bold text-slate-900 hover:text-gov-blue leading-snug">
                    <Link to={`/schemes/${scheme._id}`}>
                      {scheme.schemeName}
                    </Link>
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {scheme.department} • {scheme.state}
                  </div>

                  {/* Details Card */}
                  <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                    {app.applicationDate && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-gov-blue" />
                        <span>
                          {t('applications.appliedOn', 'Application Date')}:{' '}
                          <strong>
                            {new Date(app.applicationDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                      </div>
                    )}

                    {app.referenceNumber && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Reference / Acknowledgment No:{' '}
                          <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {app.referenceNumber}
                          </code>
                        </span>
                      </div>
                    )}

                    {app.notes && (
                      <div className="pt-1 text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-100">
                        "{app.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(app)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t('common.edit', 'Update')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app._id, scheme.schemeName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('common.delete', 'Untrack')}</span>
                    </button>
                  </div>

                  <Link
                    to={`/schemes/${scheme._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:text-blue-900"
                  >
                    <span>{t('schemeCard.viewDetails', 'Scheme Info')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Modal: Edit Tracking */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Update Tracking Record
              </h3>
              <button
                onClick={() => setEditingApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  {t('tracker.statusLabel', 'Application Status')}
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium"
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

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  {t('tracker.submissionDateLabel')}
                </label>
                <input
                  type="date"
                  value={editFormData.submissionDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      submissionDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  {t('applications.appliedOn', 'Initial Application Date')}
                </label>
                <input
                  type="date"
                  value={editFormData.applicationDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      applicationDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Application / Acknowledgment Number
                </label>
                <input
                  type="text"
                  value={editFormData.referenceNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      referenceNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. KISAN-UP-2026-99"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Personal Notes / Document Checklist
                </label>
                <textarea
                  rows="3"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  placeholder="Documents submitted at CSC, awaiting verification..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gov-blue hover:bg-blue-900 text-white font-bold rounded-lg shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Track A New Scheme */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Track a Government Scheme
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewTracking} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Select Scheme *
                </label>
                <select
                  value={newSchemeId}
                  onChange={(e) => setNewSchemeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                >
                  {availableSchemes.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.schemeName} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Current Stage
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium"
                >
                  <option value="Interested">{t('tracker.interested')}</option>
                  <option value="Preparing Documents">{t('tracker.preparingDocs')}</option>
                  <option value="Ready to Apply">{t('tracker.readyToApply')}</option>
                  <option value="Application Submitted">{t('tracker.submitted')}</option>
                  <option value="Under Review">{t('tracker.underReview')}</option>
                  <option value="Approved">{t('tracker.approved')}</option>
                  <option value="Rejected">{t('tracker.rejected')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-700">
                  Personal Notes
                </label>
                <textarea
                  rows="3"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Planning to visit Tehsil office on Monday..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gov-blue hover:bg-blue-900 text-white font-bold rounded-lg shadow"
                >
                  Add to Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
