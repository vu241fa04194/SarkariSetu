import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Landmark,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition ${
      isActive
        ? 'bg-gov-blue text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gov-blue flex items-center justify-center">
            <Landmark className="w-4 h-4 text-amber-300" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">{t('platformName')} Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gov-blue flex items-center justify-center shadow-sm">
                <Landmark className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block">
                  {t('platformName')}
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {t('admin.title')}
                </span>
              </div>
            </Link>
          </div>

          <div className="px-1">
            <LanguageSelector />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
              Core Management
            </div>
            <NavLink
              to="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('admin.dashboard')}</span>
            </NavLink>
            <NavLink
              to="/admin/schemes"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <FileText className="w-4 h-4" />
              <span>{t('admin.schemes')}</span>
            </NavLink>
            <NavLink
              to="/admin/applications"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t('admin.applications')}</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <Users className="w-4 h-4" />
              <span>{t('admin.users')}</span>
            </NavLink>
            <NavLink
              to="/admin/analytics"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('admin.analytics')}</span>
            </NavLink>
            <NavLink
              to="/admin/audit-logs"
              onClick={() => setSidebarOpen(false)}
              className={navItemClass}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('admin.auditLogs', 'Audit Logs')}</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer: User details and public link */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-[10px] text-slate-400 block">Logged In As</span>
            <span className="font-bold text-white block truncate">{user?.name}</span>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">Administrator</span>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <Link
              to="/"
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('nav.home')}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin View Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
