import React from 'react';

interface AttendanceBarProps {
  percentage: number;
  target?: number;
  totalClasses?: number;
  attendedClasses?: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export const AttendanceBar: React.FC<AttendanceBarProps> = ({
  percentage,
  target = 75,
  totalClasses = 0,
  attendedClasses = 0,
  status,
}) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Determine color scheme based on status - custom modern gradient palette
  // (Safe: Electric Cyan -> Teal -> Emerald; Warning: Amber -> Coral; Critical: Rose -> Crimson)
  const getGradient = () => {
    if (totalClasses === 0) {
      return 'from-zinc-600 to-zinc-500';
    }
    if (status === 'SAFE') {
      return 'from-cyan-400 via-teal-400 to-emerald-400';
    }
    if (status === 'WARNING') {
      return 'from-amber-400 via-orange-400 to-rose-400';
    }
    return 'from-rose-500 via-red-500 to-crimson-600';
  };

  const getGlowColor = () => {
    if (totalClasses === 0) return 'rgba(113, 113, 122, 0.2)';
    if (status === 'SAFE') return 'rgba(6, 182, 212, 0.35)';
    if (status === 'WARNING') return 'rgba(245, 158, 11, 0.35)';
    return 'rgba(244, 63, 94, 0.4)';
  };

  const isAboveTarget = clampedPercentage >= target;

  return (
    <div className="w-full space-y-1.5 py-1">
      {/* Progress Track Container */}
      <div className="relative w-full h-3.5 bg-zinc-900/90 rounded-full p-[2px] border border-white/[0.08] overflow-visible shadow-inner">
        {/* Subtle 75% target zone indicator background */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/[0.02] rounded-l-full pointer-events-none"
          style={{ width: `${target}%` }}
        />

        {/* Dynamic Gradient Attendance Bar */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-700 ease-out relative group`}
          style={{
            width: `${clampedPercentage}%`,
            boxShadow: `0 0 12px ${getGlowColor()}`,
          }}
        >
          {/* Futuristic laser sheen reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-75" />

          {/* Pulse tip at current attendance */}
          {clampedPercentage > 0 && clampedPercentage < 100 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] z-10" />
          )}
        </div>

        {/* 75% Target Threshold Marker */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-[2px] z-20 pointer-events-none flex flex-col items-center justify-center"
          style={{ left: `${target}%` }}
        >
          {/* Target vertical notch line */}
          <div
            className={`w-[2px] h-full ${isAboveTarget
                ? 'bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
              }`}
          />
        </div>
      </div>

      {/* Target Milestone Indicator Row */}
      <div className="relative w-full flex items-center justify-between text-[10px] font-mono select-none px-0.5">
        <span className="text-zinc-500 font-medium">0%</span>

        {/* Floating 75% Target Marker */}
        <div
          className="absolute -translate-x-1/2 flex items-center gap-1 font-semibold"
          style={{ left: `${target}%` }}
        >
          <span
            className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${isAboveTarget
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
              }`}
          >
            {target}% Target
          </span>
        </div>

        <span className="text-zinc-500 font-medium">100%</span>
      </div>
    </div>
  );
};

