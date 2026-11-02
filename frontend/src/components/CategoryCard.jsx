import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

// Friendly descriptions for standard categories
const categoryDescriptions = {
  Health: 'Healthcare assurance, hospital subsidies, child & maternal health initiatives.',
  Education: 'Merit scholarships, primary to higher education grants & student incentives.',
  Employment: 'Guaranteed wage employment, rural livelihoods & job creation schemes.',
  Agriculture: 'Direct farmer income assistance, crop insurance, seeds and organic farming.',
  'Irrigation & Water': 'Micro-irrigation, drip & sprinkler subsidies, farm water conservation.',
  Housing: 'Pucca houses for rural & urban families, sanitation, and clean fuel support.',
  'Women & Child Welfare': 'Girl child empowerment, nutritional support, maternal care & safety.',
  'Senior Citizens': 'Guaranteed pension security, elder care welfare, and social assistance.',
  'Disability Welfare': 'Concessional credit, assistive devices, UDID identity, and pensions.',
  'Financial Assistance': 'Direct cash transfers, micro-credit for vendors & subsidized relief.',
  'MSME / Business': 'Collateral-free loans, Mudra credit, startup & manufacturing support.',
  'Skill Development': 'National skill certification, free vocational training & stipends.',
  Farmers: 'Direct income transfers, agricultural tools, credit and fertilizer support.',
  Students: 'National scholarship portal grants, fee waivers, and academic awards.',
};

const CategoryCard = ({ category }) => {
  const { t } = useTranslation();
  const name = category.name || category;
  const count = category.count !== undefined ? category.count : null;
  const description = categoryDescriptions[name] || 'Welfare schemes, entitlements, and citizen support.';

  return (
    <Link
      to={`/schemes?category=${encodeURIComponent(name)}`}
      className="bg-white rounded-xl border border-slate-200 p-5 scheme-card-shadow transition flex flex-col justify-between group hover:border-gov-blue/50"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-gov-blue group-hover:bg-gov-blue group-hover:text-white transition-colors flex items-center justify-center">
            <CategoryIcon category={name} className="w-6 h-6" />
          </div>
          {count !== null && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-gov-blue transition-colors">
              {t('categories.schemesCount', { count, defaultValue: `${count} Schemes` })}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-gov-blue transition-colors mb-2">
          {name}
        </h3>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      <div className="flex items-center text-xs font-semibold text-gov-blue group-hover:text-blue-900 pt-2 border-t border-slate-100">
        <span>{t('categories.exploreCategory', 'Explore Schemes')}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default CategoryCard;
