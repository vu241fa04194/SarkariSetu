import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Landmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('auth.passwordMismatch', 'Please provide both email address and password'));
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-xl bg-gov-blue text-white items-center justify-center shadow-sm">
          <Landmark className="w-6 h-6 text-amber-300" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.signInTitle', 'Citizen Portal Login')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('auth.signInSubtitle', 'Access your personalized scheme recommendations and saved applications.')}
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {location.state?.message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="font-medium">{location.state.message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
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
                placeholder={t('auth.emailPlaceholder', 'citizen@example.com')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('auth.passwordLabel', 'Password')}
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
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
            <span>{submitting ? t('auth.signingIn', 'Authenticating...') : t('auth.signInBtn', 'Sign In to SarkariSetu')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>{t('auth.dontHaveAccount', "Don't have an account yet?")} </span>
          <Link
            to="/register"
            className="text-gov-blue hover:underline font-bold"
          >
            {t('auth.registerLink', 'Create Citizen Profile')}
          </Link>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center flex items-center justify-center gap-2 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secured with cryptographic password hashing & JWT</span>
      </div>
    </div>
  );
};

export default LoginPage;
