import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Menu,
  X,
  Landmark,
  Compass,
  Grid3X3,
  SlidersHorizontal,
  LayoutDashboard,
  Bookmark,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ClipboardList,
  Bell,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const { user, isAuthenticated, isAdmin, logout, savedSchemeIds, unreadNotifCount } = useAuth();
  const navigate = useNavigate();

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/schemes?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const navItemClass = ({ isActive }) =>
    `px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
      isActive
        ? 'text-gov-blue bg-blue-50 border-b-2 border-gov-blue font-bold'
        : 'text-slate-700 hover:text-gov-blue hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top subtle tricolor stripe */}
      <div className="gov-tricolor-strip w-full" />

      {/* Top utility sub-bar with Language Selector */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium">{t('common.nationalPortal')}</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">{t('common.brandTagline')}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {isAuthenticated ? (
              <span className="text-amber-300 font-medium">
                {isAdmin ? 'Admin: ' : 'Citizen: '} {user?.name}
              </span>
            ) : (
              <span>{t('common.freeAccess')}</span>
            )}

            <span>•</span>

            {/* Desktop Language Selector */}
            <LanguageSelector variant="desktop" />
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-lg bg-gov-blue text-white flex items-center justify-center shadow-sm group-hover:bg-blue-900 transition-colors">
              <Landmark className="w-6 h-6 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-gov-blue transition-colors">
                {t('common.brandName')}
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                {t('common.brandTagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden 2xl:block w-56">
            <form onSubmit={handleNavSearch} className="relative">
              <input
                type="text"
                placeholder={t('nav.searchPlaceholder')}
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full bg-slate-100 text-xs text-slate-800 pl-8 pr-3 py-1.5 rounded-full border border-slate-300 focus:outline-none focus:border-gov-blue focus:bg-white focus:ring-1 focus:ring-gov-blue transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink to="/" end className={navItemClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/schemes" className={navItemClass}>
              <div className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>{t('nav.schemes')}</span>
              </div>
            </NavLink>
            <NavLink to="/categories" className={navItemClass}>
              <div className="flex items-center gap-1">
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>{t('nav.categories')}</span>
              </div>
            </NavLink>
            <NavLink to="/eligibility" className={navItemClass}>
              <div className="flex items-center gap-1 text-amber-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('nav.eligibility')}</span>
              </div>
            </NavLink>

            {/* Authenticated Links */}
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navItemClass}>
                  <div className="flex items-center gap-1">
                    <LayoutDashboard className="w-3.5 h-3.5 text-gov-blue" />
                    <span>{t('nav.dashboard')}</span>
                  </div>
                </NavLink>
                <NavLink to="/recommendations" className={navItemClass}>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('nav.recommendations')}</span>
                  </div>
                </NavLink>
                <NavLink to="/saved-schemes" className={navItemClass}>
                  <div className="flex items-center gap-1 relative">
                    <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('nav.saved')}</span>
                    {savedSchemeIds.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                        {savedSchemeIds.length}
                      </span>
                    )}
                  </div>
                </NavLink>
                <NavLink to="/applications" className={navItemClass}>
                  <div className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('nav.tracker')}</span>
                  </div>
                </NavLink>
                <NavLink to="/notifications" className={navItemClass}>
                  <div className="flex items-center gap-1 relative">
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('nav.alerts')}</span>
                    {unreadNotifCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>
                </NavLink>
                <NavLink to="/profile" className={navItemClass}>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{t('nav.profile')}</span>
                  </div>
                </NavLink>

                {/* If Administrator, show link to Admin Dashboard */}
                {isAdmin && (
                  <NavLink
                    to="/admin/dashboard"
                    className="px-2.5 py-1.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t('nav.adminPanel')}</span>
                  </NavLink>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gov-blue hover:text-blue-900 hover:bg-slate-100 rounded-md transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.signIn')}</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-bold shadow transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('nav.register')}</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="p-2 text-indigo-600 hover:bg-slate-100 rounded-lg relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-gov-blue hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Language Selector */}
          <LanguageSelector variant="mobile" />

          <form onSubmit={handleNavSearch} className="relative my-3">
            <input
              type="text"
              placeholder={t('nav.searchPlaceholder')}
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full bg-slate-100 text-sm text-slate-800 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-blue focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          <div className="flex flex-col space-y-1 text-sm">
            <NavLink
              to="/"
              end
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium ${
                  isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/schemes"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium ${
                  isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.schemes')}
            </NavLink>
            <NavLink
              to="/categories"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium ${
                  isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.categories')}
            </NavLink>
            <NavLink
              to="/eligibility"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md font-medium ${
                  isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {t('nav.eligibility')}
            </NavLink>

            {isAuthenticated ? (
              <>
                <div className="pt-2 mt-2 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase">
                  {t('nav.citizenServices')}
                </div>
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md font-medium ${
                      isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {t('nav.dashboard')}
                </NavLink>
                <NavLink
                  to="/recommendations"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md font-medium flex items-center justify-between ${
                      isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{t('nav.recommendations')}</span>
                  </span>
                </NavLink>
                <NavLink
                  to="/saved-schemes"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md font-medium flex items-center justify-between ${
                      isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <span>{t('nav.saved')}</span>
                  {savedSchemeIds.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                      {savedSchemeIds.length}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/applications"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md font-medium ${
                      isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {t('nav.tracker')}
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md font-medium ${
                      isActive ? 'bg-blue-50 text-gov-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {t('nav.profile')}
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 rounded-md font-medium bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    {t('nav.adminPanel')}
                  </NavLink>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 pt-2 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg border border-gov-blue text-gov-blue font-semibold"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-lg bg-gov-blue text-white font-semibold"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
