import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Briefcase,
  Coins,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, getDistrictsByState } from '../data/stateDistricts';

const OCCUPATION_OPTIONS = [
  'Farmer',
  'Student',
  'Self-Employed / Business',
  'Daily Wage Worker',
  'Unemployed',
  'Private Employee',
  'Government Employee',
  'Shopkeeper / Vendor',
  'Retired / Senior',
  'Artisan / Craftsman',
  'Other',
];

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    state: '',
    district: '',
    occupation: '',
    annualIncome: '',
    ruralOrUrban: '',
    studentStatus: false,
    farmerStatus: false,
    disabilityStatus: false,
    category: '',
  });

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Populate from authenticated user profile
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age != null ? String(user.age) : '',
        gender: user.gender || '',
        state: user.state || '',
        district: user.district || '',
        occupation: user.occupation || '',
        annualIncome: user.annualIncome != null ? String(user.annualIncome) : '',
        ruralOrUrban: user.ruralOrUrban || '',
        studentStatus: !!user.studentStatus,
        farmerStatus: !!user.farmerStatus,
        disabilityStatus: !!user.disabilityStatus,
        category: user.category || '',
      });
      if (user.state) {
        setAvailableDistricts(getDistrictsByState(user.state));
      }
    }
  }, [user]);

  // Sync available districts whenever formData.state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableDistricts(getDistrictsByState(formData.state));
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.state]);

  const welcomeBanner = location.state?.welcomeMessage;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'state') {
      setFormData((prev) => ({
        ...prev,
        state: value,
        district: '', // Clear previously selected district
      }));
      setAvailableDistricts(getDistrictsByState(value));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setSaving(true);
      await updateProfile(formData);
      setSuccessMsg('Your citizen eligibility profile has been successfully updated!');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Onboarding Welcome Banner */}
      {welcomeBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Welcome to SarkariSetu!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{welcomeBanner}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            {t('profile.title', 'Citizen Profile Configuration')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('profile.title', 'Eligibility Profile Parameters')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('profile.subtitle', 'Keep your personal and demographic information updated for accurate scheme recommendations.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 self-start md:self-auto transition"
        >
          <span>{t('nav.dashboard', 'Go to Dashboard')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{t('profile.success', 'Your citizen profile has been successfully updated!')}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>{t('recommendations.title', 'View Recommendations')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-semibold">{errorMsg || t('profile.error', 'Failed to update profile. Please verify your entries.')}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-gov-blue" />
            <h2 className="text-base font-bold text-slate-900">{t('profile.personalSection', '1. Basic Personal Information')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.fullName', 'Full Name')} *
              </label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.age', 'Age (Years)')}
              </label>
              <input
                type="number"
                min="0"
                max="120"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 28"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.gender', 'Gender')}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="">{t('profile.gender', 'Select Gender')}</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Residence */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-gov-blue" />
            <h2 className="text-base font-bold text-slate-900">{t('profile.demographicSection', '2. Residence & Location')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.state', 'State of Residence')}
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="">{t('profile.state', 'Select State')}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.district', 'District')}
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.state}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.state ? t('profile.district', 'Select District') : t('profile.state', 'Select State First')}
                </option>
                {formData.district && !availableDistricts.includes(formData.district) && (
                  <option value={formData.district}>{formData.district}</option>
                )}
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Rural / Urban */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.residence', 'Area Type')}
              </label>
              <select
                name="ruralOrUrban"
                value={formData.ruralOrUrban}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="">{t('profile.residence', 'Select Area')}</option>
                <option value="Rural">Rural (Village / Gram Panchayat)</option>
                <option value="Urban">Urban (City / Municipality)</option>
                <option value="Both">Peri-Urban / Semi-Urban</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Socio-Economic Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Coins className="w-5 h-5 text-gov-blue" />
            <h2 className="text-base font-bold text-slate-900">{t('profile.demographicSection', '3. Socio-Economic Profile')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Occupation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.occupation', 'Occupation / Profession')}
              </label>
              <select
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="">{t('profile.occupation', 'Select Occupation')}</option>
                {OCCUPATION_OPTIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            {/* Annual Household Income */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.income', 'Annual Household Income (₹)')}
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                name="annualIncome"
                value={formData.annualIncome}
                onChange={handleChange}
                placeholder="e.g. 180000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
              <span className="text-[10px] text-slate-400">Used for subsidy & income ceiling calculation</span>
            </div>

            {/* Social Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('profile.socialCategory', 'Social Category (Caste)')}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="">{t('profile.socialCategory', 'Select Category')}</option>
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="Minorities">Religious Minorities</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Citizen Status Flags */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-gov-blue" />
            <h2 className="text-base font-bold text-slate-900">{t('recommendations.badge', '4. Special Citizen Entitlements')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Farmer Status */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                formData.farmerStatus
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                name="farmerStatus"
                checked={formData.farmerStatus}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-gov-blue rounded border-slate-300 focus:ring-gov-blue"
              />
              <div className="text-xs">
                <span className="font-bold block text-sm">{t('profile.farmer', 'Farmer / Landholder')}</span>
                <span className="text-slate-500 mt-0.5 block leading-relaxed">
                  Belongs to agricultural landholding household (PM-KISAN, PMKSY)
                </span>
              </div>
            </label>

            {/* Student Status */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                formData.studentStatus
                  ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                name="studentStatus"
                checked={formData.studentStatus}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-gov-blue rounded border-slate-300 focus:ring-gov-blue"
              />
              <div className="text-xs">
                <span className="font-bold block text-sm">{t('profile.student', 'Enrolled Student')}</span>
                <span className="text-slate-500 mt-0.5 block leading-relaxed">
                  Currently studying in school, college, or university (Scholarships)
                </span>
              </div>
            </label>

            {/* Disability Status */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                formData.disabilityStatus
                  ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                name="disabilityStatus"
                checked={formData.disabilityStatus}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-gov-blue rounded border-slate-300 focus:ring-gov-blue"
              />
              <div className="text-xs">
                <span className="font-bold block text-sm">{t('profile.disability', 'Divyangjan / Disability')}</span>
                <span className="text-slate-500 mt-0.5 block leading-relaxed">
                  Certified benchmark disability or UDID card holder (UDID, Concessions)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Information is encrypted and strictly used for local eligibility matching.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gov-blue hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('profile.saving', 'Saving Profile...') : t('profile.saveBtn', 'Save Profile & Calculate Matches')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
