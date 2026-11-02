import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ClipboardList,
  Check,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyNotifications();
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      refreshNotifications();
    } catch (e) {
      console.warn('Could not mark notification read', e);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      refreshNotifications();
    } catch (e) {
      alert('Error marking all notifications as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'scheme_update':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'eligibility':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'application_reminder':
        return <ClipboardList className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gov-blue" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            {t('nav.notifications', 'Citizen Alerts')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('nav.notifications', 'Notifications & Scheme Updates')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Timely notices on saved scheme guidelines, eligibility changes, and application milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition self-start md:self-auto"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text={t('common.loading', 'Retrieving citizen notifications...')} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center text-xs">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('common.noData', "You're all caught up.")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No unread notifications or scheme alerts at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && handleMarkOne(n._id)}
              className={`p-5 rounded-xl border transition flex items-start gap-4 ${
                n.read
                  ? 'bg-white border-slate-200 opacity-80'
                  : 'bg-blue-50/50 border-blue-200 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex-shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {n.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <div className="pt-2">
                    <Link
                      to={n.link}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:underline"
                    >
                      <span>View Scheme</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
