import React, { useState } from 'react';
import {
  User,
  Settings,
  Building,
  GraduationCap,
  Shield,
  Save,
  Moon,
  Sun,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ProfileSettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    collegeName: user?.collegeName || 'SRM Institute of Science & Technology',
    department: user?.department || 'Computer Science & Engineering',
    semester: user?.semester || 5,
    targetPercentage: user?.targetPercentage || 75,
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/user/settings', formData);
      updateUser(res.data.user);
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/attendance/export-csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendwise_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Profile & Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize your attendance target threshold, institutional info, and preferences
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-blue-500/25 mb-4">
            {user?.name?.charAt(0) || 'S'}
          </div>

          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {user?.name}
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.studentId}</p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/80 dark:border-blue-800/60">
            Target: {user?.targetPercentage}%
          </span>

          <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-left text-xs">
            <div>
              <span className="text-slate-400">Email:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.email}
              </p>
            </div>
            <div>
              <span className="text-slate-400">College:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.collegeName || 'SRMIST'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Department:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.department}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form & Preferences */}
        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Academic & Target Preferences
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Required Attendance Threshold (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.targetPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, targetPercentage: parseFloat(e.target.value) || 75 })
                  }
                  className="w-24 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Default is 75% as per university regulations.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Student Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                College / Institution Name
              </label>
              <input
                type="text"
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              App Preferences & Backups
            </h3>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Color Theme</p>
                <p className="text-[11px] text-slate-400">Switch between light and dark mode</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Export Attendance Data
                </p>
                <p className="text-[11px] text-slate-400">
                  Download all your subjects and attendance counts as CSV
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

