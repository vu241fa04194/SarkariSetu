import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

const LanguageSelector = ({ variant = 'desktop' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (variant === 'mobile') {
    return (
      <div className="pt-2 pb-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" />
          <span>Language / భాష / भाषा</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-3 pt-2">
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-gov-blue text-white border-gov-blue shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-[13px]">{lang.nativeLabel}</span>
                <span className="text-[10px] opacity-80">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-slate-200 hover:text-white hover:bg-white/10 transition border border-white/20 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-amber-300" />
        <span className="font-bold">{currentLanguage.nativeLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/10 focus:outline-none z-50 py-1 border border-slate-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                  isSelected
                    ? 'bg-blue-50 text-gov-blue font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">{lang.nativeLabel}</span>
                  <span className="text-[10px] text-slate-400">{lang.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-gov-blue" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
