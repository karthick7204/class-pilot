import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  User as UserIcon,
  AlertCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { SrmCourseMarks } from '../../types';

interface MarksViewProps {
  subjects: any[];
  marks?: SrmCourseMarks[];
}

export const MarksView: React.FC<MarksViewProps> = ({ subjects, marks = [] }) => {
  // Extract real internal marks from subjects and marks list
  const subjectMarks: SrmCourseMarks[] = subjects
    .map((s) => s.internalMarks)
    .filter(Boolean);

  const combinedMap = new Map<string, SrmCourseMarks>();
  for (const m of subjectMarks) {
    combinedMap.set(m.subjectCode.toUpperCase(), m);
  }
  for (const m of marks) {
    const key = m.subjectCode.toUpperCase();
    if (!combinedMap.has(key) || (m.isPublished && !combinedMap.get(key)?.isPublished)) {
      combinedMap.set(key, m);
    }
  }

  const coursesWithMarks: SrmCourseMarks[] = Array.from(combinedMap.values());

  const publishedCourses = coursesWithMarks.filter((c) => c.isPublished && c.totalMax > 0);
  const totalAssessed = publishedCourses.length;

  const avgPercentage =
    totalAssessed > 0
      ? Number(
          (
            publishedCourses.reduce((acc, c) => acc + c.internalPercentage, 0) /
            totalAssessed
          ).toFixed(1)
        )
      : null;

  const totalScoredSum = publishedCourses.reduce((acc, c) => acc + c.totalScored, 0);
  const totalMaxSum = publishedCourses.reduce((acc, c) => acc + c.totalMax, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 pb-2">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Official Internal Marks
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Internal assessment records retrieved directly from your SRM student portal report.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-mono text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live SRM Portal Synchronized
          </span>
        </div>
      </div>

      {/* Quick Internal Marks KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Average Internal % */}
        <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">
            Average Internal Score
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl font-black font-mono ${
                avgPercentage !== null
                  ? avgPercentage >= 75
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                  : 'text-zinc-500'
              }`}
            >
              {avgPercentage !== null ? `${avgPercentage}%` : 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {totalAssessed > 0 ? `${totalAssessed} published` : 'Pending publish'}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Marks Scored */}
        <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">
            Published Courses
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black font-mono text-white">
              {totalAssessed}{' '}
              <span className="text-zinc-500 text-sm">/ {coursesWithMarks.length}</span>
            </span>
            <span className="text-[10px] text-zinc-500">
              {coursesWithMarks.length - totalAssessed} pending
            </span>
          </div>
        </div>

        {/* KPI 3: Academic Standing */}
        <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">
            Assessment Status
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold text-indigo-400">
              {totalAssessed > 0 ? 'Evaluating' : 'Awaiting Marks'}
            </span>
            <span className="text-[10px] text-zinc-500">
              Current Semester
            </span>
          </div>
        </div>

        {/* KPI 4: Exam Eligibility */}
        <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-zinc-400">
            Internal Standing
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Registered
            </span>
            <span className="text-[10px] text-zinc-500">
              SRM Enrolled
            </span>
          </div>
        </div>
      </div>

      {/* If no marks have been published on portal yet */}
      {totalAssessed === 0 && (
        <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-6 sm:p-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 flex items-center justify-center text-amber-400 border border-amber-800/60 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Marks Not Yet Published on SRM Portal
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your registered courses are authenticated from your SRM student portal report. However, Continuous Internal Assessment marks (CLA-1 / CLA-2 / Assignments) have not been uploaded by your course faculty to the portal yet. Once published on the portal, your exact scores will appear here automatically.
            </p>
          </div>
        </div>
      )}

      {/* Course-Wise Internal Marks Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Enrolled Courses Internal Status ({coursesWithMarks.length})
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {coursesWithMarks.map((course) => {
            const subject = subjects.find(
              (s) => s.subjectCode === course.subjectCode || s.subjectName === course.subjectName
            );

            const hasPublishedMarks = course.isPublished && course.totalMax > 0;

            return (
              <div
                key={course.subjectCode}
                className="bg-[#121622] hover:bg-[#141a29] rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/40"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                        {course.subjectName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 text-[11px]">
                          {course.subjectCode}
                        </span>

                        {subject?.category && (
                          <span className="text-zinc-400 font-medium">
                            {subject.category}
                          </span>
                        )}

                        {subject?.credits && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{subject.credits}</span>
                          </>
                        )}
                      </div>

                      {subject?.faculty && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-0.5">
                          <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{subject.faculty}</span>
                        </div>
                      )}
                    </div>

                    {/* Right side Score & Grade Badge */}
                    <div className="flex flex-col items-end shrink-0 pl-2 text-right">
                      {hasPublishedMarks ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none text-white">
                            {course.totalScored}{' '}
                            <span className="text-sm text-zinc-500 font-medium">
                              / {course.totalMax}
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                              {course.internalPercentage}%
                            </span>
                            {course.grade && (
                              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                                Grade {course.grade}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-semibold text-amber-400/90 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                            Awaiting Publication
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1">
                            Not uploaded by faculty
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar or Pending Indicator */}
                  <div className="mt-5 mb-4">
                    {hasPublishedMarks ? (
                      <div className="w-full h-3 bg-zinc-900 rounded-full p-[2px] border border-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(course.internalPercentage, 100)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>SRM portal record: Marks publication pending</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed Assessments Breakdown if published */}
                  {hasPublishedMarks && course.assessments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
                      {course.assessments.map((a, idx) => (
                        <div
                          key={idx}
                          className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] text-center"
                        >
                          <span className="text-[10px] text-zinc-400 block truncate font-medium">
                            {a.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-white mt-1 block">
                            {a.scoredMarks}{' '}
                            <span className="text-[10px] text-zinc-500">/ {a.maxMarks}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Standing */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {hasPublishedMarks ? 'Verified from SRM Portal' : 'Registered Enrolled Subject'}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500 text-[11px]">
                    SRM Student Portal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
