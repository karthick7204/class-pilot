export interface User {
  id: string;
  name: string;
  studentId: string;
  email: string;
  targetPercentage: number;
  collegeName?: string;
  department?: string;
  semester?: number;
}

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

export interface AssessmentItem {
  name: string;
  scoredMarks: number;
  maxMarks: number;
  percentage?: number;
}

export interface SrmCourseMarks {
  subjectCode: string;
  subjectName: string;
  assessments: AssessmentItem[];
  totalScored: number;
  totalMax: number;
  internalPercentage: number;
  grade?: string;
  isPublished: boolean;
  status: 'SAFE' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'PENDING';
  statusMessage?: string;
}

export interface Subject extends AttendanceMetrics {
  id: string;
  subjectCode?: string;
  subjectName: string;
  category?: string;
  credits?: string | number;
  faculty?: string;
  teacherName?: string;
  color: string;
  targetOverride?: number;
  updatedAt: string;
  internalMarks?: SrmCourseMarks;
}

export interface AttendanceLog {
  id: string;
  subjectId: string;
  status: 'PRESENT' | 'ABSENT' | 'CANCELLED';
  date: string;
  notes?: string;
  subject?: {
    id: string;
    subjectName: string;
    subjectCode?: string;
    color?: string;
  };
}

export interface SimulationResponse {
  simulation: {
    currentPercentage: number;
    projectedTotal: number;
    projectedAttended: number;
    projectedAbsent: number;
    projectedPercentage: number;
    targetPercentage: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
    netChange: number;
    willMeetTarget: boolean;
  };
  currentMetrics: AttendanceMetrics;
}

