import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const SchemeCard = ({ scheme }) => {
  const { t } = useTranslation();
  if (!scheme) return null;

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between scheme-card-shadow transition-all group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-100">
            <CategoryIcon category={scheme.category} className="w-3.5 h-3.5" />
            {scheme.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <MapPin className="w-3 h-3 text-slate-500" />
            {scheme.state}
          </span>
        </div>

        {/* Scheme Name */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2 mb-2 leading-snug">
          <Link to={`/schemes/${scheme._id}`}>
            {scheme.schemeName}
          </Link>
        </h3>

        {/* Department */}
        <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-3 line-clamp-1">
          <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
          <span>{scheme.department}</span>
        </div>

        {/* Description Excerpt */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {scheme.description}
        </p>

        {/* Key Benefits Highlight */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {t('recommendations.keyBenefit')}
            </div>
            <p className="text-xs text-slate-700 line-clamp-2">
              {scheme.benefits[0]}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(scheme.lastUpdated || scheme.updatedAt)}</span>
        </div>

        <Link
          to={`/schemes/${scheme._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:text-blue-900 group/link"
        >
          <span>{t('common.buttons.viewDetails')}</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
};

export default SchemeCard;
