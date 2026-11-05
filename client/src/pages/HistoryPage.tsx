import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { AttendanceLog, Subject } from '../types';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      const url =
        selectedSubjectId === 'ALL'
          ? '/attendance/logs'
          : `/attendance/logs?subjectId=${selectedSubjectId}`;
      const res = await api.get(url);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedSubjectId]);

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Revert this logged session and update subject class counts?')) {
      try {
        await api.delete(`/attendance/logs/${logId}`);
        await fetchLogs();
      } catch (err) {
        console.error('Error deleting log:', err);
      }
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
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Attendance History & Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological log of marked classes, dates, and historical adjustments
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Filter by Course:
        </span>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold"
        >
          <option value="ALL">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subjectCode ? `${s.subjectCode} - ` : ''}
              {s.subjectName}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No history logs recorded yet
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Logs will automatically appear here when you mark attendance or sync your portal.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {logs.map((log) => {
              const isPresent = log.status === 'PRESENT';
              const logDate = new Date(log.date);

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}
                    >
                      {isPresent ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {log.subject?.subjectCode && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {log.subject.subjectCode}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {log.subject?.subjectName || 'Course'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {logDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {log.notes && <span>• {log.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isPresent
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      title="Revert Log"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

