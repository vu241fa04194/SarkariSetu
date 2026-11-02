import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  Building2,
  Laptop,
  HelpCircle,
} from 'lucide-react';

const ApplicationGuidance = ({ scheme }) => {
  const { t } = useTranslation();

  const guidance = scheme?.applicationGuidance || {};
  const instructions =
    guidance.stepByStepInstructions?.length > 0
      ? guidance.stepByStepInstructions
      : scheme?.applicationProcess?.length > 0
      ? scheme.applicationProcess
      : [];

  const submissionMethod = guidance.submissionMethod || 'Online';
  const deadlines = guidance.deadlines || 'Information not available';
  const helpline = guidance.helpline || {};
  const warnings = guidance.warnings || [];
  const portalUrl = scheme?.officialWebsite || guidance.sourceUrl || scheme?.sourceURL;

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'Online':
        return 'bg-blue-50 text-gov-blue border-blue-200';
      case 'Offline':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Online & Offline':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CSC / Seva Kendra':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'Online':
        return t('guidance.submissionOnline');
      case 'Offline':
        return t('guidance.submissionOffline');
      case 'Online & Offline':
        return t('guidance.submissionBoth');
      case 'CSC / Seva Kendra':
        return t('guidance.submissionCSC');
      default:
        return t('guidance.submissionNotSpecified');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gov-blue mb-0.5">
            {t('guidance.howToApply')}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {t('guidance.howToApplySubtitle')}
          </h3>
        </div>

        {/* Submission Method Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            {t('guidance.submissionMethod')}:
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${getMethodBadgeClass(
              submissionMethod
            )}`}
          >
            {getMethodLabel(submissionMethod)}
          </span>
        </div>
      </div>

      {/* Official Portal Action Button */}
      {portalUrl ? (
        <div className="bg-gradient-to-r from-blue-900 to-gov-blue rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('schemes.verifiedSource')}</span>
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {scheme?.schemeName}
            </div>
            <p className="text-[11px] text-slate-300">
              Apply directly on the implementing ministry or nodal department portal.
            </p>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition flex-shrink-0"
          >
            <span>{t('guidance.verifiedPortal')}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          {t('guidance.infoNotAvailable')}
        </div>
      )}

      {/* Step-by-Step Instructions */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-gov-blue" />
          <span>{t('guidance.stepByStep')}</span>
        </h4>

        {instructions.length > 0 ? (
          <ol className="space-y-2.5">
            {instructions.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
              >
                <span className="w-6 h-6 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-medium">{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500 italic">
            {t('guidance.infoNotAvailable')}
          </p>
        )}
      </div>

      {/* Two-Column Grid: Deadlines & Helpline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deadlines Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-gov-blue" />
            <span>{t('guidance.deadlines')}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {deadlines}
          </p>
        </div>

        {/* Helpline Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{t('guidance.helpline')}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            {helpline.phone ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{t('guidance.phone')}:</span>
                <span className="font-bold text-slate-900">{helpline.phone}</span>
              </div>
            ) : null}

            {helpline.email ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{t('guidance.email')}:</span>
                <span className="text-gov-blue font-medium">{helpline.email}</span>
              </div>
            ) : null}

            {helpline.hours ? (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{helpline.hours}</span>
              </div>
            ) : null}

            {!helpline.phone && !helpline.email && (
              <p className="text-xs text-slate-500 italic">
                {t('guidance.infoNotAvailable')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Warnings & Advisories */}
      {warnings.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t('guidance.warnings')}</span>
          </div>
          <ul className="space-y-1.5 list-disc pl-5 leading-relaxed text-amber-800">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ApplicationGuidance;
