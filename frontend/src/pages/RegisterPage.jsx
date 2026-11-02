import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, AlertCircle, Landmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError(t('auth.passwordMismatch', 'Please fill in all mandatory fields'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordMinLength', 'Password must be at least 8 characters long'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    try {
      setSubmitting(true);
      await register(name, email, password);
      // Navigate to profile setup so user can immediately provide eligibility parameters
      navigate('/profile', {
        state: { welcomeMessage: 'Account created! Please set up your citizen eligibility parameters below.' },
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-xl bg-gov-blue text-white items-center justify-center shadow-sm">
          <Landmark className="w-6 h-6 text-amber-300" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.registerTitle', 'Create Citizen Account')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('auth.registerSubtitle', 'Get personalized scheme recommendations tailored to your profile.')}
        </p>
      </div>

      {/* Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.nameLabel', 'Full Name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder', 'Ramesh Kumar')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.emailLabel', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder', 'ramesh.kumar@example.com')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.passwordLabel', 'Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'At least 8 characters')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('auth.confirmPasswordLabel', 'Confirm Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder', 'Repeat password')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-gov-blue hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>{submitting ? t('auth.registering', 'Creating Account...') : t('auth.registerBtn', 'Register Citizen Account')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>{t('auth.alreadyHaveAccount', 'Already registered?')} </span>
          <Link
            to="/login"
            className="text-gov-blue hover:underline font-bold"
          >
            {t('auth.signInLink', 'Log in to your account')}
          </Link>
        </div>
      </div>

      {/* Security info */}
      <div className="text-center text-[11px] text-slate-400 leading-relaxed">
        By registering, you agree to access public welfare scheme information for personal discovery. No charges are ever levied for government scheme access.
      </div>
    </div>
  );
};

export default RegisterPage;
