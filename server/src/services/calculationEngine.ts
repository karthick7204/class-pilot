export interface AttendanceMetrics {
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  targetPercentage: number;
  requiredClasses: number;
  margin: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  statusMessage: string;
}

export interface SimulationResult {
  currentPercentage: number;
  projectedTotal: number;
  projectedAttended: number;
  projectedAbsent: number;
  projectedPercentage: number;
  targetPercentage: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  netChange: number;
  willMeetTarget: boolean;
}

/**
 * Validates and normalizes attendance counts
 */
export function validateAttendanceCounts(totalClasses: number, attendedClasses: number): void {
  if (totalClasses < 0) {
    throw new Error('Total classes cannot be negative.');
  }
  if (attendedClasses < 0) {
    throw new Error('Attended classes cannot be negative.');
  }
  if (attendedClasses > totalClasses) {
    throw new Error('Attended classes cannot exceed total classes conducted.');
  }
}

/**
 * Calculates attendance metrics using exact integer counts and formulas
 * T = Total classes conducted
 * A = Classes attended
 * R = Required attendance percentage / 100
 */
export function calculateAttendanceMetrics(
  totalClasses: number,
  attendedClasses: number,
  targetPercentage: number = 75.0
): AttendanceMetrics {
  validateAttendanceCounts(totalClasses, attendedClasses);

  if (targetPercentage <= 0 || targetPercentage > 100) {
    throw new Error('Target percentage must be between 1 and 100.');
  }

  const R = targetPercentage / 100;
  const absentClasses = totalClasses - attendedClasses;

  // Handle case where no classes have been conducted yet
  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      absentClasses: 0,
      percentage: 100.0,
      targetPercentage,
      requiredClasses: 0,
      margin: 0,
      status: 'SAFE',
      statusMessage: 'No classes conducted yet.',
    };
  }

  // Exact raw ratio
  const currentRatio = attendedClasses / totalClasses;
  const percentage = Number(((attendedClasses / totalClasses) * 100).toFixed(2));

  let requiredClasses = 0;
  let margin = 0;
  let statusMessage = '';

  if (currentRatio >= R) {
    // Student has already achieved target percentage
    requiredClasses = 0;
    // Leave Margin Formula: floor((A - R * T) / R)
    margin = Math.floor((attendedClasses - R * totalClasses) / R);
    if (margin < 0) margin = 0;

    statusMessage =
      margin > 0
        ? `You can safely miss ${margin} upcoming class${margin > 1 ? 'es' : ''} while maintaining at least ${targetPercentage}%.`
        : `You have reached exactly ${targetPercentage}%. Do not miss your next class.`;
  } else {
    // Shortage: Student needs to attend consecutive classes
    // Formula: ceil((R * T - A) / (1 - R))
    requiredClasses = Math.ceil((R * totalClasses - attendedClasses) / (1 - R));
    margin = 0;

    statusMessage = `You need to attend ${requiredClasses} consecutive class${
      requiredClasses > 1 ? 'es' : ''
    } to reach ${targetPercentage}%.`;
  }

  let status: 'SAFE' | 'WARNING' | 'CRITICAL';
  if (percentage >= targetPercentage) {
    status = 'SAFE';
  } else if (percentage >= targetPercentage - 10) {
    status = 'WARNING';
  } else {
    status = 'CRITICAL';
  }

  return {
    totalClasses,
    attendedClasses,
    absentClasses,
    percentage,
    targetPercentage,
    requiredClasses,
    margin,
    status,
    statusMessage,
  };
}

/**
 * Simulates a hypothetical what-if attendance situation
 * e.g., "What if I miss the next M classes and attend C classes?"
 */
export function simulateAttendance(
  totalClasses: number,
  attendedClasses: number,
  futureMissed: number = 0,
  futureAttended: number = 0,
  targetPercentage: number = 75.0
): SimulationResult {
  validateAttendanceCounts(totalClasses, attendedClasses);

  if (futureMissed < 0 || futureAttended < 0) {
    throw new Error('Future class counts cannot be negative.');
  }

  const currentPercentage =
    totalClasses === 0 ? 100.0 : Number(((attendedClasses / totalClasses) * 100).toFixed(2));

  const projectedTotal = totalClasses + futureMissed + futureAttended;
  const projectedAttended = attendedClasses + futureAttended;
  const projectedAbsent = projectedTotal - projectedAttended;

  const projectedPercentage =
    projectedTotal === 0
      ? 100.0
      : Number(((projectedAttended / projectedTotal) * 100).toFixed(2));

  const netChange = Number((projectedPercentage - currentPercentage).toFixed(2));
  const willMeetTarget = projectedPercentage >= targetPercentage;

  let status: 'SAFE' | 'WARNING' | 'CRITICAL';
  if (projectedPercentage >= targetPercentage) {
    status = 'SAFE';
  } else if (projectedPercentage >= targetPercentage - 10) {
    status = 'WARNING';
  } else {
    status = 'CRITICAL';
  }

  return {
    currentPercentage,
    projectedTotal,
    projectedAttended,
    projectedAbsent,
    projectedPercentage,
    targetPercentage,
    status,
    netChange,
    willMeetTarget,
  };
}

