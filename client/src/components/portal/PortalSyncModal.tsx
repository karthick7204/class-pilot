import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  ShieldCheck,
  ClipboardPaste,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface PortalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PortalSyncModal: React.FC<PortalSyncModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'srm' | 'paste'>('srm');

  // SRM Form states
  const [netId, setNetId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [captchaDataUrl, setCaptchaDataUrl] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Paste Form states
  const [pastedText, setPastedText] = useState('');

  // Fetch CAPTCHA whenever modal is opened on SRM tab
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (user?.studentId && !netId) {
        setNetId(user.studentId);
      }
      fetchFreshCaptcha();
    }
  }, [isOpen]);

  const fetchFreshCaptcha = async () => {
    setLoadingCaptcha(true);
    setErrorMsg('');
    try {
      const res = await api.get('/portal/srm/captcha');
      setSessionId(res.data.sessionId);
      setCaptchaDataUrl(res.data.captchaDataUrl);
      setCaptchaInput('');
    } catch (err: any) {
      setErrorMsg('Failed to load portal CAPTCHA. Click reload to retry.');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  const handleSrmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netId || !password || !captchaInput) {
      setErrorMsg('Please fill in your NetID, Password, and the CAPTCHA characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/portal/srm/sync', {
        sessionId,
        netId,
        password,
        captcha: captchaInput,
      });

      setSuccessMsg(res.data.message || 'Attendance synced successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please check your credentials and CAPTCHA.');
      // Refresh captcha on failure
      fetchFreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setErrorMsg('Please paste the attendance table rows.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/portal/parse-table', {
        rawContent: pastedText,
      });

      setSuccessMsg(res.data.message || 'Attendance imported successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to parse attendance data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Connect College Portal
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                SRMIST Student Portal Live Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              setActiveTab('srm');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'srm'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Portal Login + CAPTCHA
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Portal Table
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: SRM Portal Form */}
        {activeTab === 'srm' && (
          <form onSubmit={handleSrmSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                NetID <span className="text-slate-400 font-normal">(without @srmist.edu.in)</span>
              </label>
              <input
                type="text"
                value={netId}
                onChange={(e) => setNetId(e.target.value)}
                placeholder="e.g. ab1234 or RA2211003010123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Portal Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>

            {/* Captcha Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enter CAPTCHA
                </label>
                <button
                  type="button"
                  onClick={fetchFreshCaptcha}
                  disabled={loadingCaptcha}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter letters"
                  maxLength={8}
                  className="w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-widest text-center"
                  required
                />

                <div className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {loadingCaptcha ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Loading...
                    </div>
                  ) : captchaDataUrl ? (
                    <img
                      src={captchaDataUrl}
                      alt="Portal Captcha"
                      className="h-full w-auto object-contain select-none"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No Captcha</span>
                  )}
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Your portal password is only used in memory for this instant sync and is <strong>never saved on disk or in the database</strong>.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || loadingCaptcha}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting & Syncing Attendance...
                </>
              ) : (
                'Sync Attendance in Background'
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Smart Table Paste */}
        {activeTab === 'paste' && (
          <form onSubmit={handlePasteSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Paste Attendance Table from Portal
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Log into your college portal, select the attendance table rows (or entire page text), copy (Ctrl+C), and paste (Ctrl+V) here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                required
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Works with copied HTML tables, tab-delimited spreadsheets, or CSV records. AttendWise auto-detects subject names, total conducted classes, and attended classes.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Parsing Attendance Table...
                </>
              ) : (
                'Import Attendance Data'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

