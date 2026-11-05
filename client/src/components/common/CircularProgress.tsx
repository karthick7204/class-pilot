import React from 'react';

interface CircularProgressProps {
  percentage: number;
  targetPercentage?: number;
  size?: number;
  strokeWidth?: number;
  showTargetIndicator?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  targetPercentage = 75,
  size = 140,
  strokeWidth = 12,
  showTargetIndicator = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const boundedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (boundedPercentage / 100) * circumference;

  let strokeColor = '#22c55e'; // Safe (Green)
  if (percentage < targetPercentage - 10) {
    strokeColor = '#ef4444'; // Critical (Red)
  } else if (percentage < targetPercentage) {
    strokeColor = '#f59e0b'; // Warning (Amber)
  }

  // Calculate coordinates for target percentage tick mark
  const targetAngle = (targetPercentage / 100) * 360 - 90;
  const targetRad = (targetAngle * Math.PI) / 180;
  const tickX = size / 2 + (radius + strokeWidth / 2 + 3) * Math.cos(targetRad);
  const tickY = size / 2 + (radius + strokeWidth / 2 + 3) * Math.sin(targetRad);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Target indicator mark */}
      {showTargetIndicator && (
        <div
          title={`Required Target: ${targetPercentage}%`}
          style={{
            position: 'absolute',
            left: `${tickX}px`,
            top: `${tickY}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-slate-950 shadow-sm"
        />
      )}

      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight text-white">
          {typeof percentage === 'number' && !isNaN(percentage) ? percentage.toFixed(1) : '0.0'}
          <span className="text-lg font-bold text-slate-400">%</span>
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
          {percentage >= targetPercentage ? 'Safe Zone' : 'Shortage'}
        </span>
      </div>
    </div>
  );
};

