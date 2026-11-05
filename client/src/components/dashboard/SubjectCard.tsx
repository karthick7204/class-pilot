import React from 'react';
import {
  Calendar,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AttendanceBar } from './AttendanceBar';

interface SubjectCardProps {
  subject: {
    subjectCode?: string;
    subjectName: string;
    category?: string;
    credits?: string | number;
    faculty?: string;
    totalClasses: number;
    attendedClasses: number;
    absentClasses: number;
    percentage: number;
    requiredClasses: number;
    margin: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
    statusMessage: string;
    internalMarks?: {
      subjectCode: string;
      subjectName: string;
      assessments: Array<{ name: string; scoredMarks: number; maxMarks: number; percentage?: number }>;
      totalScored: number;
      totalMax: number;
      internalPercentage: number;
      grade?: string;
      status: 'SAFE' | 'GOOD' | 'NEEDS_IMPROVEMENT';
    };
  };
  onSimulate?: (subjectCode: string) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onSimulate }) => {
  const isZero = subject.totalClasses === 0;
  const isSafe = subject.percentage >= 75;

  // Determine top-right metric
  const metricNumber = isZero
    ? null
    : isSafe
    ? subject.margin
    : subject.requiredClasses;

  const metricLabel = isZero
    ? 'No classes yet'
    : isSafe
    ? 'classes safe to miss'
    : 'classes needed to reach 75%';

  const metricColor = isZero
    ? 'text-zinc-500'
    : isSafe
    ? 'text-emerald-400'
    : subject.percentage >= 65
    ? 'text-amber-400'
    : 'text-rose-400';

  const percentageColor = isZero
    ? 'text-zinc-500'
    : isSafe
    ? 'text-emerald-400'
    : subject.percentage >= 65
    ? 'text-amber-400'
    : 'text-rose-400';

  return (
    <div className="group relative bg-[#121622] hover:bg-[#141a29] rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/40">
      {/* Top Section: Title & Margin / Required Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          {/* Left Title & Meta */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors">
              {subject.subjectName}
            </h2>

            {/* Course Code, Category & Credits Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 text-[11px]">
                {subject.subjectCode || 'COURSE'}
              </span>

              {subject.category && (
                <span className="text-zinc-400 font-medium">
                  {subject.category}
                </span>
              )}

              {subject.credits && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">{subject.credits}</span>
                </>
              )}
            </div>

            {/* Faculty Info */}
            {subject.faculty && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-0.5">
                <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{subject.faculty}</span>
              </div>
            )}
          </div>

          {/* Right Margin / Needed Classes Counter */}
          <div className="flex flex-col items-end shrink-0 pl-2 text-right">
            {metricNumber !== null ? (
              <>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${metricColor}`}
                >
                  {metricNumber}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 mt-1">
                  {metricLabel}
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-zinc-500 py-1">
                No classes yet
              </span>
            )}
          </div>
        </div>

        {/* Middle Numbers & Percentage Row */}
        <div className="flex items-end justify-between mt-5 mb-2">
          {/* Present, Absent, Total Counts */}
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-300">
            <div>
              <span className="text-zinc-500 text-[11px] block">Present</span>
              <span className="text-sm font-bold font-mono text-white">
                {subject.attendedClasses}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-zinc-500 text-[11px] block">Absent</span>
              <span className="text-sm font-bold font-mono text-white">
                {subject.absentClasses}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-zinc-500 text-[11px] block">Total</span>
              <span className="text-sm font-bold font-mono text-white">
                {subject.totalClasses}
              </span>
            </div>
          </div>

          {/* Big Attendance Percentage */}
          <div className="text-right">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${percentageColor}`}
            >
              {isZero ? '0.0%' : `${subject.percentage.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Custom Attendance Progress Bar */}
        <div className="mt-2 mb-4">
          <AttendanceBar
            percentage={subject.percentage}
            target={75}
            totalClasses={subject.totalClasses}
            attendedClasses={subject.attendedClasses}
            status={subject.status}
          />
        </div>
      </div>

      {/* Bottom Footer: Breathing Room Status & Quick Simulate Action */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {isZero ? (
            <>
              <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-400 truncate">
                No classes yet • Awaiting upcoming schedule
              </span>
            </>
          ) : isSafe ? (
            <>
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-zinc-200 font-semibold">
                  {subject.margin} period{subject.margin !== 1 ? 's' : ''} of breathing room
                </span>
                <span className="text-zinc-500 ml-1.5 hidden sm:inline">
                  Stay at or above 75%.
                </span>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="truncate">
                <span className="text-rose-300 font-semibold">
                  Needs {subject.requiredClasses} class{subject.requiredClasses !== 1 ? 'es' : ''}
                </span>
                <span className="text-zinc-500 ml-1.5 hidden sm:inline">
                  to reach 75% target.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quick Simulate Button */}
        {onSimulate && (
          <button
            onClick={() => onSimulate(subject.subjectCode || 'OVERALL')}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-cyan-300 border border-white/[0.06] transition-all text-[11px] font-medium"
            title="Simulate future attendance for this subject"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        )}
      </div>
    </div>
  );
};

