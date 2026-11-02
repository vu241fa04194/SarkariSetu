import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Landmark, Phone, Info } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gov-blue text-white flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {t('common.brandName')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="pt-2 text-xs text-slate-500">
              <span>{t('common.brandTagline')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.schemes')}
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.categories')}
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.eligibility')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.categories')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/schemes?category=Agriculture" className="text-slate-400 hover:text-white transition-colors">
                  Agriculture & Farmers
                </Link>
              </li>
              <li>
                <Link to="/schemes?category=Health" className="text-slate-400 hover:text-white transition-colors">
                  Health & Medical Care
                </Link>
              </li>
              <li>
                <Link to="/schemes?category=Education" className="text-slate-400 hover:text-white transition-colors">
                  Education & Scholarships
                </Link>
              </li>
              <li>
                <Link to="/schemes?category=MSME+/+Business" className="text-slate-400 hover:text-white transition-colors">
                  MSME & Business Credit
                </Link>
              </li>
            </ul>
          </div>

          {/* Citizen Helplines */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.contact')}
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">National Portal:</span> 1800-11-0031
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Ayushman Bharat:</span> 14555 / 1800-111-565
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Kisan Call Centre:</span> 1800-180-1551
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Women Helpline:</span> 181
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Statutory Disclaimer Notice */}
        <div className="border-t border-slate-800 pt-6 pb-4">
          <div className="bg-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3 border border-slate-700/80">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-300">
                {t('footer.disclaimer')}
              </p>
              <p className="text-[11px] text-slate-400">
                {t('common.disclaimer')}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} {t('common.brandName')}. {t('footer.rights')}</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{t('common.freeAccess')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
