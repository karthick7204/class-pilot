import React, { useState } from 'react';
import {
  X,
  Calculator,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: any[];
  overall: any;
  initialCourseCode?: string;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  overall,
  initialCourseCode = 'OVERALL',
}) => {
  const [selectedCode, setSelectedCode] = useState<string>(initialCourseCode);
  const [missCount, setMissCount] = useState<number>(0);
  const [attendCount, setAttendCount] = useState<number>(0);

  if (!isOpen) return null;

  const currentSubject =
    selectedCode === 'OVERALL'
      ? {
          name: 'Overall Attendance',
          code: 'OVERALL',
          total: overall?.totalClasses || 0,
          attended: overall?.attendedClasses || 0,
          percentage: overall?.percentage || 0,
        }
      : (() => {
          const s = subjects.find((sub) => sub.subjectCode === selectedCode);
          return {
            name: s?.subjectName || 'Selected Course',
            code: s?.subjectCode || selectedCode,
            total: s?.totalClasses || 0,
            attended: s?.attendedClasses || 0,
            percentage: s?.percentage || 0,
          };
        })();

  const projectedTotal = currentSubject.total + missCount + attendCount;
  const projectedAttended = currentSubject.attended + attendCount;
  const projectedPercentage =
    projectedTotal === 0
      ? 100.0
      : Number(((projectedAttended / projectedTotal) * 100).toFixed(2));

  const netChange = Number((projectedPercentage - currentSubject.percentage).toFixed(2));
  const willMeetTarget = projectedPercentage >= 75;

  const handleReset = () => {
    setMissCount(0);
    setAttendCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#111622] rounded-3xl border border-white/[0.1] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/60">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Interactive Attendance Simulator
              </h2>
              <p className="text-xs text-zinc-400">
                Simulate "What happens if I miss or attend upcoming classes?"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Select Course to Simulate:
          </label>
          <select
            value={selectedCode}
            onChange={(e) => {
              setSelectedCode(e.target.value);
              handleReset();
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.1] text-white text-sm font-medium focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="OVERALL">⚡ Overall Attendance (All Subjects)</option>
            {subjects.map((s) => (
              <option key={s.subjectCode} value={s.subjectCode}>
                [{s.subjectCode}] {s.subjectName} ({s.percentage.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Sliders Container */}
        <div className="space-y-5 bg-zinc-900/60 p-5 rounded-2xl border border-white/[0.06]">
          {/* Miss Classes Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                What if I <span className="font-black uppercase">MISS</span> next classes?
              </span>
              <span className="font-mono font-bold text-sm text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                {missCount} class{missCount !== 1 ? 'es' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={missCount}
              onChange={(e) => setMissCount(parseInt(e.target.value) || 0)}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Attend Classes Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                What if I <span className="font-black uppercase">ATTEND</span> next classes?
              </span>
              <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                {attendCount} class{attendCount !== 1 ? 'es' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={attendCount}
              onChange={(e) => setAttendCount(parseInt(e.target.value) || 0)}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset simulator</span>
          </button>
        </div>

        {/* Projected Result Box */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            willMeetTarget
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Projected Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {projectedPercentage.toFixed(2)}%
                </span>
                {netChange !== 0 && (
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      netChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {netChange > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {netChange > 0 ? `+${netChange}%` : `${netChange}%`}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              {willMeetTarget ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Safe &gt;= 75%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Shortage Alert</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-300">
            <span>
              Projected: <strong>{projectedAttended}</strong> / {projectedTotal} classes
            </span>
            <span>
              Current: <strong>{currentSubject.percentage.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition-all"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

