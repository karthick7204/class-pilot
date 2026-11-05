import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '../components/common/CircularProgress';
import { StatusBadge } from '../components/common/StatusBadge';

export const CalculatorPage: React.FC = () => {
  const { user } = useAuth();

  // State for current attendance
  const [totalClasses, setTotalClasses] = useState(40);
  const [attendedClasses, setAttendedClasses] = useState(32);
  const [targetPercentage, setTargetPercentage] = useState(user?.targetPercentage || 75);

  // Hypothetical "What-If" simulator
  const [futureMissed, setFutureMissed] = useState(0);
  const [futureAttended, setFutureAttended] = useState(0);

  // Live calculated results
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Keep attended <= total
    const safeTotal = Math.max(0, totalClasses);
    const safeAttended = Math.min(safeTotal, Math.max(0, attendedClasses));

    const R = targetPercentage / 100;
    const currentPct =
      safeTotal === 0 ? 100.0 : Number(((safeAttended / safeTotal) * 100).toFixed(2));

    let requiredClasses = 0;
    let margin = 0;

    if (safeTotal > 0 && safeAttended / safeTotal >= R) {
      margin = Math.floor((safeAttended - R * safeTotal) / R);
      if (margin < 0) margin = 0;
    } else if (safeTotal > 0) {
      requiredClasses = Math.ceil((R * safeTotal - safeAttended) / (1 - R));
    }

    // What-if projected values
    const projectedTotal = safeTotal + futureMissed + futureAttended;
    const projectedAttended = safeAttended + futureAttended;
    const projectedPct =
      projectedTotal === 0
        ? 100.0
        : Number(((projectedAttended / projectedTotal) * 100).toFixed(2));

    const netChange = Number((projectedPct - currentPct).toFixed(2));
    const isMeetingTarget = projectedPct >= targetPercentage;

    setResult({
      currentPct,
      requiredClasses,
      margin,
      projectedTotal,
      projectedAttended,
      projectedAbsent: projectedTotal - projectedAttended,
      projectedPct,
      netChange,
      isMeetingTarget,
      status:
        projectedPct >= targetPercentage
          ? 'SAFE'
          : projectedPct >= targetPercentage - 10
          ? 'WARNING'
          : 'CRITICAL',
    });
  }, [totalClasses, attendedClasses, targetPercentage, futureMissed, futureAttended]);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Attendance & What-If Calculator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate future attendance scenarios, calculate exact leave margins, and plan upcoming leaves safely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Base Parameters Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Base Attendance Inputs
                </h3>
              </div>
              <span className="text-xs text-slate-400">Step 1</span>
            </div>

            {/* Total Classes */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">
                  Total Classes Conducted (T)
                </span>
                <span className="text-blue-600 font-mono text-sm">{totalClasses}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={totalClasses}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTotalClasses(val);
                  if (attendedClasses > val) setAttendedClasses(val);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Attended Classes */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">
                  Classes Attended (A)
                </span>
                <span className="text-emerald-600 font-mono text-sm">{attendedClasses}</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalClasses}
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Target Percentage */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">
                  Target Attendance Percentage
                </span>
                <span className="text-amber-600 font-mono text-sm">{targetPercentage}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* What-If Simulator Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 rounded-3xl border border-blue-200/80 dark:border-blue-900/50 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/40 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hypothetical "What-If" Simulator
                </h3>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Step 2: Test Future
              </span>
            </div>

            {/* Miss Next X Classes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  What if I <strong className="text-rose-600">MISS</strong> the next classes?
                </span>
                <span className="text-rose-600 font-mono text-sm">{futureMissed} class(es)</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={futureMissed}
                  onChange={(e) => setFutureMissed(parseInt(e.target.value, 10))}
                  className="flex-1 accent-rose-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setFutureMissed(0)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Attend Next Y Classes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  What if I <strong className="text-emerald-600">ATTEND</strong> the next classes?
                </span>
                <span className="text-emerald-600 font-mono text-sm">{futureAttended} class(es)</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={futureAttended}
                  onChange={(e) => setFutureAttended(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setFutureAttended(0)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Projected Outcome
            </span>

            <div className="my-2">
              <CircularProgress
                percentage={result?.projectedPct || 0}
                targetPercentage={targetPercentage}
                size={170}
                strokeWidth={14}
              />
            </div>

            {/* Net Change Pill */}
            {result && (futureMissed > 0 || futureAttended > 0) && (
              <div
                className={`mt-3 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                  result.netChange >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {result.netChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {result.netChange > 0 ? `+${result.netChange}%` : `${result.netChange}%`} from base
                </span>
              </div>
            )}

            <div className="w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              {/* Projected Status Message */}
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold ${
                  result?.isMeetingTarget
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                }`}
              >
                {result?.isMeetingTarget
                  ? `Safe Zone! You will comfortably maintain ${result.projectedPct}%, which meets your ${targetPercentage}% requirement.`
                  : `Warning! This scenario will drop your attendance to ${result?.projectedPct}%, below the ${targetPercentage}% minimum requirement.`}
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Safe Leave Margin
                  </span>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {result?.margin} classes
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Required to Recover
                  </span>
                  <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                    {result?.requiredClasses} classes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

