import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Tag,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { getSchemeById, createScheme, updateScheme } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const CATEGORY_CHOICES = [
  'Health',
  'Education',
  'Employment',
  'Agriculture',
  'Irrigation & Water',
  'Housing',
  'Women & Child Welfare',
  'Senior Citizens',
  'Disability Welfare',
  'Financial Assistance',
  'MSME / Business',
  'Skill Development',
  'Farmers',
  'Students',
];

const AdminSchemeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    schemeName: '',
    category: 'Health',
    department: '',
    description: '',
    benefits: '',
    eligibility: '',
    requiredDocuments: '',
    applicationProcess: '',
    state: 'All India',
    officialWebsite: '',
    // Phase 2 structured eligibility
    minimumAge: '',
    maximumAge: '',
    occupations: '',
    maximumIncome: '',
    applicableGender: 'All',
    ruralUrban: 'Both',
    studentRequired: false,
    farmerRequired: false,
    disabilityRequired: false,
    applicableCategories: 'All',
    // Phase 3 attributes
    status: 'Active',
    verificationStatus: 'Verified',
    sourceName: 'Official Ministry Portal',
    sourceURL: '',
    sourceType: 'Central Government',
    // Phase 7 guidance attributes
    submissionMethod: 'Online',
    deadlines: '',
    helplinePhone: '',
    helplineEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      const fetchScheme = async () => {
        try {
          setLoading(true);
          const res = await getSchemeById(id);
          if (res?.data) {
            const s = res.data;
            setFormData({
              schemeName: s.schemeName || '',
              category: s.category || 'Health',
              department: s.department || '',
              description: s.description || '',
              benefits: (s.benefits || []).join('\n'),
              eligibility: (s.eligibility || []).join('\n'),
              requiredDocuments: (s.requiredDocuments || []).join('\n'),
              applicationProcess: (s.applicationProcess || []).join('\n'),
              state: s.state || 'All India',
              officialWebsite: s.officialWebsite || '',
              minimumAge: s.minimumAge != null ? String(s.minimumAge) : '',
              maximumAge: s.maximumAge != null ? String(s.maximumAge) : '',
              occupations: (s.occupations || []).join(', '),
              maximumIncome: s.maximumIncome != null ? String(s.maximumIncome) : '',
              applicableGender: s.applicableGender || 'All',
              ruralUrban: s.ruralUrban || 'Both',
              studentRequired: Boolean(s.studentRequired),
              farmerRequired: Boolean(s.farmerRequired),
              disabilityRequired: Boolean(s.disabilityRequired),
              applicableCategories: (s.applicableCategories || ['All']).join(', '),
              status: s.status || 'Active',
              verificationStatus: s.verificationStatus || 'Pending Verification',
              sourceName: s.sourceName || 'Official Portal',
              sourceURL: s.sourceURL || s.officialWebsite || '',
              sourceType: s.sourceType || 'Official Portal',
              submissionMethod: s.applicationGuidance?.submissionMethod || 'Online',
              deadlines: s.applicationGuidance?.deadlines || '',
              helplinePhone: s.applicationGuidance?.helpline?.phone || '',
              helplineEmail: s.applicationGuidance?.helpline?.email || '',
            });
          }
        } catch (err) {
          setError(err.message || 'Failed to fetch scheme data.');
        } finally {
          setLoading(false);
        }
      };
      fetchScheme();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      benefits: formData.benefits.split('\n').filter(Boolean),
      eligibility: formData.eligibility.split('\n').filter(Boolean),
      requiredDocuments: formData.requiredDocuments.split('\n').filter(Boolean),
      applicationProcess: formData.applicationProcess.split('\n').filter(Boolean),
      occupations: formData.occupations.split(',').map((s) => s.trim()).filter(Boolean),
      applicableCategories: formData.applicableCategories.split(',').map((s) => s.trim()).filter(Boolean),
      minimumAge: formData.minimumAge ? Number(formData.minimumAge) : null,
      maximumAge: formData.maximumAge ? Number(formData.maximumAge) : null,
      maximumIncome: formData.maximumIncome ? Number(formData.maximumIncome) : null,
      sourceURL: formData.sourceURL || formData.officialWebsite,
      applicationGuidance: {
        submissionMethod: formData.submissionMethod || 'Online',
        deadlines: formData.deadlines || 'Check official portal for active cycle dates',
        officialPortalURL: formData.sourceURL || formData.officialWebsite,
        helpline: {
          phone: formData.helplinePhone || '',
          email: formData.helplineEmail || '',
        },
      },
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await updateScheme(id, payload);
      } else {
        await createScheme(payload);
      }
      navigate('/admin/schemes');
    } catch (err) {
      setError(err.message || 'Failed to save scheme.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading scheme details..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/schemes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schemes Catalog</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isEditing ? 'Edit Government Scheme' : 'Add New Government Scheme'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ensure that official guidelines and sources are accurate before saving.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Scheme Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-blue pb-2 border-b border-slate-100">
              1. Basic Scheme Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  required
                  name="schemeName"
                  value={formData.schemeName}
                  onChange={handleChange}
                  placeholder="e.g. Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                >
                  {CATEGORY_CHOICES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State Availability *
                </label>
                <input
                  type="text"
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="All India or Specific State"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department / Ministry *
                </label>
                <input
                  type="text"
                  required
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Ministry of Agriculture & Farmers Welfare"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  required
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed explanation of the scheme objectives..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Benefits, Eligibility, Documents & Process */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-blue pb-2 border-b border-slate-100">
              2. Detailed Entitlements & Requirements (One Item Per Line)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Benefits (one per line)
                </label>
                <textarea
                  rows="3"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Direct cash transfer of ₹6,000 per year..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Eligibility Criteria (one per line)
                </label>
                <textarea
                  rows="3"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  placeholder="Landholding farmer family..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Required Documents (one per line)
                </label>
                <textarea
                  rows="3"
                  name="requiredDocuments"
                  value={formData.requiredDocuments}
                  onChange={handleChange}
                  placeholder="Aadhaar Card&#10;Land Records..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Application Steps (one per line)
                </label>
                <textarea
                  rows="3"
                  name="applicationProcess"
                  value={formData.applicationProcess}
                  onChange={handleChange}
                  placeholder="Step 1: Visit portal...&#10;Step 2: Submit Aadhaar..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Phase 3 Verification & Official Source */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-blue pb-2 border-b border-slate-100">
              3. Status, Verification & Official Source
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catalog Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="Active">Active (Visible to citizens)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Verification Status
                </label>
                <select
                  name="verificationStatus"
                  value={formData.verificationStatus}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="Verified">Verified by Admin</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Needs Review">Needs Review</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Source Type
                </label>
                <select
                  name="sourceType"
                  value={formData.sourceType}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="Central Government">Central Government</option>
                  <option value="State Government">State Government</option>
                  <option value="Government Department">Government Department</option>
                  <option value="Official Portal">Official Portal</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Source Name
                </label>
                <input
                  type="text"
                  name="sourceName"
                  value={formData.sourceName}
                  onChange={handleChange}
                  placeholder="e.g. Official Ministry of Agriculture Portal"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Application URL
                </label>
                <input
                  type="url"
                  name="officialWebsite"
                  value={formData.officialWebsite}
                  onChange={handleChange}
                  placeholder="https://pmkisan.gov.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Structured Eligibility Rules */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-blue pb-2 border-b border-slate-100">
              4. Structured Eligibility Rules (Smart Engine)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Minimum Age
                </label>
                <input
                  type="number"
                  name="minimumAge"
                  value={formData.minimumAge}
                  onChange={handleChange}
                  placeholder="e.g. 18"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Maximum Age
                </label>
                <input
                  type="number"
                  name="maximumAge"
                  value={formData.maximumAge}
                  onChange={handleChange}
                  placeholder="e.g. 40"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Max Annual Income (₹)
                </label>
                <input
                  type="number"
                  name="maximumIncome"
                  value={formData.maximumIncome}
                  onChange={handleChange}
                  placeholder="e.g. 300000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Applicable Gender
                </label>
                <select
                  name="applicableGender"
                  value={formData.applicableGender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="All">All Genders</option>
                  <option value="Female">Female Only</option>
                  <option value="Male">Male Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Area (Rural / Urban)
                </label>
                <select
                  name="ruralUrban"
                  value={formData.ruralUrban}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                >
                  <option value="Both">Both / Any</option>
                  <option value="Rural">Rural Only</option>
                  <option value="Urban">Urban Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Occupations (comma-separated)
                </label>
                <input
                  type="text"
                  name="occupations"
                  value={formData.occupations}
                  onChange={handleChange}
                  placeholder="Farmer, Daily Wage Worker..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="sm:col-span-3 flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    name="studentRequired"
                    checked={formData.studentRequired}
                    onChange={handleChange}
                    className="rounded text-gov-blue"
                  />
                  <span>Student Status Required</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    name="farmerRequired"
                    checked={formData.farmerRequired}
                    onChange={handleChange}
                    className="rounded text-gov-blue"
                  />
                  <span>Farmer Status Required</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    name="disabilityRequired"
                    checked={formData.disabilityRequired}
                    onChange={handleChange}
                    className="rounded text-gov-blue"
                  />
                  <span>Disability (Divyangjan) Required</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Phase 7 Application Guidance & Helpline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gov-blue pb-2 border-b border-slate-100">
              5. Application Guidance & Helpline (Phase 7)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Submission Method
                </label>
                <select
                  name="submissionMethod"
                  value={formData.submissionMethod}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                >
                  <option value="Online">Online Portal</option>
                  <option value="Offline">Offline / District Office</option>
                  <option value="CSC / MeeSeva">CSC / MeeSeva Center</option>
                  <option value="Bank Branch">Bank Branch</option>
                  <option value="Hybrid">Hybrid (Online & Physical)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Application Deadlines / Cycles
                </label>
                <input
                  type="text"
                  name="deadlines"
                  value={formData.deadlines}
                  onChange={handleChange}
                  placeholder="e.g. Open year-round or 31st July annually"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Helpline Phone Number
                </label>
                <input
                  type="text"
                  name="helplinePhone"
                  value={formData.helplinePhone}
                  onChange={handleChange}
                  placeholder="e.g. 1800-115-555 or 14447"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Helpline Email Address
                </label>
                <input
                  type="email"
                  name="helplineEmail"
                  value={formData.helplineEmail}
                  onChange={handleChange}
                  placeholder="e.g. support@gov.in"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/admin/schemes"
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Scheme...' : isEditing ? 'Update Scheme' : 'Publish Scheme'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSchemeFormPage;
