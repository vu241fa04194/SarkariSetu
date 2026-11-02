import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  ArrowRight,
  Compass,
  AlertCircle,
  Building2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { getSavedSchemes, removeSavedScheme } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SchemeCardSkeleton } from '../components/LoadingSpinner';
import CategoryIcon from '../components/CategoryIcon';

const SavedSchemesPage = () => {
  const { t } = useTranslation();
  const { toggleSaveScheme } = useAuth();
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSavedSchemes();
      if (res?.data) {
        setSavedSchemes(res.data);
      }
    } catch (err) {
      console.error('Failed to load saved schemes:', err);
      setError(err.message || 'Failed to retrieve saved schemes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (schemeId) => {
    try {
      await removeSavedScheme(schemeId);
      setSavedSchemes((prev) => prev.filter((s) => s._id !== schemeId));
    } catch (err) {
      console.error('Failed to remove scheme:', err);
      alert('Failed to remove scheme. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
            {t('dashboard.bookmarked', 'Citizen Bookmarks')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('saved.title', 'Your Saved Government Schemes')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('saved.subtitle', 'Keep track of schemes you are preparing documents for or intend to apply to.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue hover:bg-blue-900 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Compass className="w-4 h-4" />
            <span>{t('saved.browseBtn', 'Discover More Schemes')}</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SchemeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && savedSchemes.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('saved.noSavedTitle', "You haven't saved any schemes yet.")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t('saved.noSavedDesc', 'Explore schemes and save the ones you are interested in.')}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gov-blue text-white text-xs font-semibold hover:bg-blue-900 transition shadow-sm"
            >
              <span>{t('recommendations.title', 'View Recommendations')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid of Saved Schemes */}
      {!loading && !error && savedSchemes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSchemes.map((scheme) => (
            <div
              key={scheme._id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Header: Category & State */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-100">
                    <CategoryIcon category={scheme.category} className="w-3.5 h-3.5" />
                    {scheme.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {scheme.state}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 hover:text-gov-blue mb-2 line-clamp-2">
                  <Link to={`/schemes/${scheme._id}`}>
                    {scheme.schemeName}
                  </Link>
                </h3>

                {/* Department */}
                <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-3 line-clamp-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{scheme.department}</span>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {scheme.description}
                </p>
              </div>

              {/* Card Footer: Remove & Details */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => handleRemove(scheme._id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('common.delete', 'Remove')}</span>
                </button>

                <Link
                  to={`/schemes/${scheme._id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gov-blue hover:text-blue-900"
                >
                  <span>{t('schemeCard.viewDetails', 'View Details')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSchemesPage;
