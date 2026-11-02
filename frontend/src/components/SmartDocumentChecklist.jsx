import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  UserCheck,
  Building,
  Edit3,
} from 'lucide-react';
import {
  getSchemeChecklist,
  toggleChecklistItem,
  resetSchemeChecklist,
  saveSchemeChecklist,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const SmartDocumentChecklist = ({ scheme }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'collected'
  const [items, setItems] = useState([]);
  const [personalizedDocs, setPersonalizedDocs] = useState([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingNoteDoc, setEditingNoteDoc] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [showNotApplicable, setShowNotApplicable] = useState(false);

  // Local storage key for guest checklist state
  const guestStorageKey = `sarkarisetu_guest_checklist_${scheme?._id}`;

  useEffect(() => {
    if (!scheme?._id) return;

    const loadChecklist = async () => {
      setLoading(true);
      if (isAuthenticated) {
        try {
          const res = await getSchemeChecklist(scheme._id);
          if (res?.data) {
            setItems(res.data.checklist?.items || []);
            setPersonalizedDocs(res.data.personalizedDocs || []);
            setPersonalNotes(res.data.checklist?.personalNotes || '');
          }
        } catch (err) {
          console.warn('Failed to fetch user checklist from server:', err);
          fallbackToDefaultDocs();
        }
      } else {
        // Guest mode: load from localStorage if available, or generate from scheme
        fallbackToDefaultDocs();
      }
      setLoading(false);
    };

    loadChecklist();
  }, [scheme?._id, isAuthenticated, user]);

  const fallbackToDefaultDocs = () => {
    const rawDocs = scheme.documentRequirements || [];
    const formattedDocs = rawDocs.length > 0
      ? rawDocs.map((doc) => {
          let isApplicable = true;
          let applicabilityStatus = doc.documentType;
          let missingField = null;
          let reason = doc.description || '';

          if (doc.documentType === 'conditional') {
            if (!user) {
              applicabilityStatus = 'conditional';
              reason = doc.conditionDescription || 'Conditional requirement based on applicant demographics.';
            } else {
              if (doc.conditionType === 'farmer') {
                if (user.isFarmer === true || user.occupation === 'Farmer') {
                  applicabilityStatus = 'conditional';
                  reason = 'Applicable: You are registered as an agricultural farmer.';
                } else if (user.isFarmer === false && user.occupation !== 'Farmer') {
                  applicabilityStatus = 'not_applicable';
                  isApplicable = false;
                  reason = 'Not applicable: Agricultural landholder proof only for farmers.';
                } else {
                  missingField = 'isFarmer';
                }
              } else if (doc.conditionType === 'student') {
                if (user.isStudent === true || user.occupation === 'Student') {
                  applicabilityStatus = 'conditional';
                  reason = 'Applicable: You are registered as a student.';
                } else if (user.isStudent === false && user.occupation !== 'Student') {
                  applicabilityStatus = 'not_applicable';
                  isApplicable = false;
                  reason = 'Not applicable: Academic records only for enrolled students.';
                } else {
                  missingField = 'isStudent';
                }
              } else if (doc.conditionType === 'disability') {
                if (user.hasDisability === true) {
                  applicabilityStatus = 'conditional';
                  reason = 'Applicable: UDID benchmark disability certificate required.';
                } else if (user.hasDisability === false) {
                  applicabilityStatus = 'not_applicable';
                  isApplicable = false;
                  reason = 'Not applicable: Only required for Divyangjan quota.';
                } else {
                  missingField = 'hasDisability';
                }
              } else if (doc.conditionType === 'reserved_category') {
                if (['SC', 'ST', 'OBC'].includes(user.category)) {
                  applicabilityStatus = 'conditional';
                  reason = `Applicable: Caste certificate required for ${user.category} quota.`;
                } else if (user.category === 'General') {
                  applicabilityStatus = 'not_applicable';
                  isApplicable = false;
                  reason = 'Not applicable: Caste certificate not required for General category.';
                } else {
                  missingField = 'category';
                }
              }
            }
          }

          return {
            documentName: doc.documentName,
            documentType: doc.documentType,
            conditionType: doc.conditionType,
            applicabilityStatus,
            isApplicable,
            missingField,
            reason: doc.description || reason,
            description: doc.description,
            conditionDescription: doc.conditionDescription,
            issuingAuthority: doc.issuingAuthority || '',
          };
        })
      : (scheme.requiredDocuments || []).map((docName) => ({
          documentName: docName,
          documentType: 'required',
          conditionType: 'all',
          applicabilityStatus: 'required',
          isApplicable: true,
          missingField: null,
          reason: 'Mandatory documentation for scheme registration & KYC verification.',
          description: 'Mandatory documentation for scheme registration & KYC verification.',
          issuingAuthority: '',
        }));

    setPersonalizedDocs(formattedDocs);

    // Retrieve guest stored items
    try {
      const stored = localStorage.getItem(guestStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setPersonalNotes(parsed.personalNotes || '');
        return;
      }
    } catch (e) {
      console.warn('Failed to parse guest checklist from localStorage', e);
    }

    // Default items
    const initialItems = formattedDocs
      .filter((d) => d.isApplicable)
      .map((d) => ({
        documentName: d.documentName,
        documentType: d.documentType,
        conditionType: d.conditionType,
        status: 'pending',
        notes: '',
      }));
    setItems(initialItems);
  };

  const handleToggleStatus = async (documentName, currentStatus) => {
    const nextStatus = currentStatus === 'collected' ? 'pending' : 'collected';

    const updatedItems = items.map((i) => {
      if (i.documentName.toLowerCase() === documentName.toLowerCase()) {
        return {
          ...i,
          status: nextStatus,
          collectedAt: nextStatus === 'collected' ? new Date().toISOString() : null,
        };
      }
      return i;
    });

    // If item was not yet in items (e.g. from personalizedDocs), add it
    if (!items.some((i) => i.documentName.toLowerCase() === documentName.toLowerCase())) {
      updatedItems.push({
        documentName,
        status: nextStatus,
        notes: '',
        collectedAt: nextStatus === 'collected' ? new Date().toISOString() : null,
      });
    }

    setItems(updatedItems);

    if (isAuthenticated) {
      try {
        await toggleChecklistItem(scheme._id, {
          documentName,
          status: nextStatus,
        });
      } catch (err) {
        console.warn('Failed to sync checklist toggle with server:', err);
      }
    } else {
      localStorage.setItem(
        guestStorageKey,
        JSON.stringify({ items: updatedItems, personalNotes })
      );
    }
  };

  const handleSaveNote = async (documentName) => {
    const updatedItems = items.map((i) => {
      if (i.documentName.toLowerCase() === documentName.toLowerCase()) {
        return { ...i, notes: tempNote };
      }
      return i;
    });

    if (!items.some((i) => i.documentName.toLowerCase() === documentName.toLowerCase())) {
      updatedItems.push({
        documentName,
        status: 'pending',
        notes: tempNote,
      });
    }

    setItems(updatedItems);
    setEditingNoteDoc(null);
    setTempNote('');

    if (isAuthenticated) {
      try {
        await toggleChecklistItem(scheme._id, {
          documentName,
          notes: tempNote,
        });
      } catch (err) {
        console.warn('Failed to save document note to server:', err);
      }
    } else {
      localStorage.setItem(
        guestStorageKey,
        JSON.stringify({ items: updatedItems, personalNotes })
      );
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('checklist.resetConfirm'))) return;

    const resetItems = items.map((i) => ({
      ...i,
      status: 'pending',
      collectedAt: null,
      notes: '',
    }));
    setItems(resetItems);
    setPersonalNotes('');

    if (isAuthenticated) {
      try {
        await resetSchemeChecklist(scheme._id);
      } catch (err) {
        console.warn('Failed to reset checklist on server:', err);
      }
    } else {
      localStorage.removeItem(guestStorageKey);
    }
  };

  // Metrics
  const applicableDocs = personalizedDocs.filter((d) => d.isApplicable);
  const notApplicableDocs = personalizedDocs.filter((d) => !d.isApplicable);
  const collectedCount = items.filter((i) => i.status === 'collected').length;
  const totalCount = applicableDocs.length || items.length || 1;
  const completionPercentage = Math.round((collectedCount / Math.max(totalCount, 1)) * 100);

  // Missing info check
  const missingFields = personalizedDocs
    .filter((d) => d.missingField)
    .map((d) => d.missingField);
  const uniqueMissingFields = [...new Set(missingFields)];

  // Filter items for tabs
  const getDocumentStatus = (docName) => {
    const found = items.find((i) => i.documentName.toLowerCase() === docName.toLowerCase());
    return found?.status || 'pending';
  };

  const getDocumentNotes = (docName) => {
    const found = items.find((i) => i.documentName.toLowerCase() === docName.toLowerCase());
    return found?.notes || '';
  };

  const filteredDocs = applicableDocs.filter((doc) => {
    const st = getDocumentStatus(doc.documentName);
    if (activeTab === 'pending') return st === 'pending';
    if (activeTab === 'collected') return st === 'collected';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {t('checklist.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('checklist.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-semibold transition"
          title={t('checklist.resetBtn')}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('checklist.resetBtn')}</span>
        </button>
      </div>

      {/* Official Advisory Alert */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-gov-blue mt-0.5 flex-shrink-0" />
        <span className="leading-relaxed">
          {t('checklist.disclaimer')}
        </span>
      </div>

      {/* Guest Mode Notice */}
      {!isAuthenticated && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <span>{t('checklist.guestNotice')}</span>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex-shrink-0"
          >
            {t('checklist.signInPrompt')}
          </Link>
        </div>
      )}

      {/* Profile Incomplete Banner */}
      {isAuthenticated && uniqueMissingFields.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-purple-700 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold block">{t('checklist.missingInfoTitle')}</span>
              <span className="text-purple-700">{t('checklist.missingInfoDesc')}</span>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow-xs transition flex-shrink-0"
          >
            {t('checklist.updateProfileLink')}
          </Link>
        </div>
      )}

      {/* Readiness Progress Bar */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-gov-blue" />
            {t('checklist.completion')}
          </span>
          <span className="text-gov-blue text-sm">
            {collectedCount} / {totalCount} ({completionPercentage}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              completionPercentage === 100
                ? 'bg-emerald-600'
                : completionPercentage >= 50
                ? 'bg-gov-blue'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(completionPercentage, 4)}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'all'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('checklist.all')} ({applicableDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'pending'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('checklist.pending')} ({applicableDocs.length - collectedCount})
        </button>
        <button
          onClick={() => setActiveTab('collected')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'collected'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('checklist.collected')} ({collectedCount})
        </button>
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            {activeTab === 'collected'
              ? t('checklist.emptyCollected')
              : activeTab === 'pending'
              ? t('checklist.emptyPending')
              : t('checklist.emptyAll')}
          </div>
        ) : (
          filteredDocs.map((doc, idx) => {
            const isCollected = getDocumentStatus(doc.documentName) === 'collected';
            const notes = getDocumentNotes(doc.documentName);
            const isEditing = editingNoteDoc === doc.documentName;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCollected
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(doc.documentName, getDocumentStatus(doc.documentName))}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                        isCollected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 hover:border-gov-blue bg-white'
                      }`}
                      aria-label={`Toggle ${doc.documentName}`}
                    >
                      {isCollected && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            isCollected
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {doc.documentName}
                        </span>

                        {/* Document Type Badge */}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            doc.documentType === 'required'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : doc.documentType === 'conditional'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {doc.documentType === 'required'
                            ? t('checklist.required')
                            : doc.documentType === 'conditional'
                            ? t('checklist.conditional')
                            : t('checklist.optional')}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCollected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCollected ? t('checklist.collectedStatus') : t('checklist.pendingStatus')}
                        </span>
                      </div>

                      {/* Explanation */}
                      {doc.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-700">
                            {t('checklist.whyNeeded')}:{' '}
                          </span>
                          {doc.description}
                        </p>
                      )}

                      {/* Issuing Authority */}
                      {doc.issuingAuthority && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {t('checklist.issuingAuthority')}: <span className="font-medium text-slate-600">{doc.issuingAuthority}</span>
                          </span>
                        </div>
                      )}

                      {/* Personal Note Display or Input */}
                      {notes && !isEditing && (
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start justify-between gap-2">
                          <span className="italic">"{notes}"</span>
                          <button
                            onClick={() => {
                              setEditingNoteDoc(doc.documentName);
                              setTempNote(notes);
                            }}
                            className="text-gov-blue hover:underline text-[11px] font-semibold flex-shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder={t('checklist.personalNotesPlaceholder')}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-gov-blue"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveNote(doc.documentName)}
                              className="px-2.5 py-1 bg-gov-blue text-white rounded text-[11px] font-bold"
                            >
                              Save Note
                            </button>
                            <button
                              onClick={() => setEditingNoteDoc(null)}
                              className="px-2.5 py-1 border border-slate-200 rounded text-[11px] text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : !notes && (
                        <button
                          onClick={() => {
                            setEditingNoteDoc(doc.documentName);
                            setTempNote('');
                          }}
                          className="mt-1 text-[11px] text-slate-400 hover:text-gov-blue flex items-center gap-1 font-medium transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Add note</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Non-applicable Documents Accordion */}
      {notApplicableDocs.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowNotApplicable(!showNotApplicable)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
          >
            <span>
              {t('checklist.notApplicable')} ({notApplicableDocs.length})
            </span>
            {showNotApplicable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showNotApplicable && (
            <div className="mt-2 space-y-2">
              {notApplicableDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs opacity-70 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-semibold text-slate-700 block line-through">
                      {doc.documentName}
                    </span>
                    <span className="text-[11px] text-slate-500">{doc.reason}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                    {t('checklist.notApplicable')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartDocumentChecklist;
