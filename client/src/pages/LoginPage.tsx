import React, { useState, useEffect } from 'react';
import { Lock, User, RefreshCw, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, studentData: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [captchaDataUrl, setCaptchaDataUrl] = useState('');

  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'login' | 'paste'>('login');
  const [pastedContent, setPastedContent] = useState('');
  const [parsingPaste, setParsingPaste] = useState(false);

  // Fetch real live SRM CAPTCHA on mount
  useEffect(() => {
    fetchFreshCaptcha();
  }, []);

  const fetchFreshCaptcha = async () => {
    setLoadingCaptcha(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/srm/captcha`);
      setSessionId(res.data.sessionId);
      setCaptchaDataUrl(res.data.captchaDataUrl);
      setCaptchaInput('');
    } catch (err: any) {
      console.error('Failed to load CAPTCHA:', err);
      setErrorMsg(
        err.response?.data?.error ||
          'Failed to connect to SRMIST Student Portal. Click refresh to retry.'
      );
    } finally {
      setLoadingCaptcha(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !captchaInput.trim()) {
      setErrorMsg('Please enter your SRM NetID, Password, and the CAPTCHA characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/srm/login`, {
        sessionId,
        username: username.trim(),
        password,
        captcha: captchaInput.trim(),
      });

      onLoginSuccess(res.data.token, res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication with SRM portal failed.';
      setErrorMsg(msg);
      // Refresh captcha so they can try fresh without reloading page
      fetchFreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedContent.trim()) {
      setErrorMsg('Please copy and paste the attendance table from your SRM portal.');
      return;
    }

    setParsingPaste(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/srm/parse-table`, {
        rawContent: pastedContent,
        netId: username.trim() || 'STUDENT',
      });

      onLoginSuccess(res.data.token, res.data.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to parse attendance table.');
    } finally {
      setParsingPaste(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/30">
            <span className="font-black text-2xl tracking-tighter text-white">SRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SRM Smart Attendance Tracker
          </h1>
          <p className="text-xs text-blue-200/70 mt-1.5">
            Log in with your official SRM student portal credentials to extract live attendance & calculate margins.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Method Selector Tabs */}
          <div className="flex border-b border-slate-800 pb-3 mb-5 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Direct SRM Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Paste Portal Table (Instant)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
            {/* NetID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                NetID <span className="text-slate-500 font-normal">(without '@srmist.edu.in')</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ab1234 or your student NetID"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Portal Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Live Captcha Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  SRM Portal Captcha
                </label>
                <button
                  type="button"
                  onClick={fetchFreshCaptcha}
                  disabled={loadingCaptcha}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCaptcha ? 'animate-spin' : ''}`} />
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
                  className="w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-widest text-center"
                  required
                />

                <div className="flex-1 h-12 bg-white rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                  {loadingCaptcha ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      Loading...
                    </div>
                  ) : captchaDataUrl ? (
                    <img
                      src={captchaDataUrl}
                      alt="SRM Portal Live Captcha"
                      className="h-full w-auto object-contain select-none"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Failed to load</span>
                  )}
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Passwords are authenticated directly with <strong>sp.srmist.edu.in</strong> in memory. We never store portal passwords.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || loadingCaptcha}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting to SRM & Fetching Real Attendance...
                </>
              ) : (
                <>
                  Log In & Fetch Live Attendance
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your NetID (Optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ab1234"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Paste Attendance Table
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Open your SRM portal in another tab, go to Attendance, select and copy the table (or press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">Ctrl+A</kbd> on the attendance page), and paste it here:
                </p>
                <textarea
                  rows={6}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste table text or HTML rows here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs font-mono outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={parsingPaste}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {parsingPaste ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Parsing Attendance Table...
                  </>
                ) : (
                  <>
                    Load Attendance Dashboard Instantly
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          SRM Smart Attendance Tracker • Direct Integration with sp.srmist.edu.in
        </p>
      </div>
    </div>
  );
};
