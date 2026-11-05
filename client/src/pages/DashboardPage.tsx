import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Percent,
  Calendar,
  BarChart2,
  Clock,
  CalendarCheck,
  Calculator,
  BookOpen,
  Sparkles,
  Utensils,
  Users,
  Settings,
  Scale,
  LogOut,
  Search,
  RefreshCw,
  FolderTree,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { SubjectCard } from '../components/dashboard/SubjectCard';
import { SimulatorModal } from '../components/dashboard/SimulatorModal';
import { MarksView } from '../components/dashboard/MarksView';

interface DashboardProps {
  data: any;
  onLogout: () => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ data, onLogout, onRefresh }) => {
  const overall = data?.overall;
  const subjects = useMemo(() => data?.subjects || [], [data?.subjects]);

  // UI state
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'dashboard'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorSubjectCode, setSimulatorSubjectCode] = useState<string>('OVERALL');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Student info from real login
  const studentName = data?.studentName || 'Student';
  const registerNumber = data?.registerNumber || '';
  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0].toUpperCase())
    .join('') || 'ST';

  // Filter subjects based on live search bar
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const query = searchQuery.toLowerCase().trim();
    return subjects.filter((s: any) => {
      const name = (s.subjectName || '').toLowerCase();
      const code = (s.subjectCode || '').toLowerCase();
      const category = (s.category || '').toLowerCase();
      const faculty = (s.faculty || '').toLowerCase();
      return (
        name.includes(query) ||
        code.includes(query) ||
        category.includes(query) ||
        faculty.includes(query)
      );
    });
  }, [subjects, searchQuery]);

  // Open simulator for a specific subject
  const handleOpenSimulator = (code: string = 'OVERALL') => {
    setSimulatorSubjectCode(code);
    setIsSimulatorOpen(true);
  };

  return (
    <div className="h-screen w-full bg-[#0A0D14] text-zinc-100 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ===================== FIXED SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#0D111A] border-r border-white/[0.06] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Nav items */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-5 space-y-6">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Percent className="w-4 h-4 text-white font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-widest uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  ATTENWISE
                </span>
                <span className="text-[10px] font-mono font-medium text-cyan-400 tracking-wider">
                  CAMPUS PORTAL
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: YOUR STUDIES */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Your Studies
            </span>
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('attendance');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'attendance'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-white/[0.06]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <span>Attendance</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  {subjects.length}
                </span>
              </button>

              <button
                onClick={() => {
                  handleOpenSimulator();
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Future Calculator</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                  What-If
                </span>
              </button>

              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <Calendar className="w-4 h-4" />
                <span>Planner</span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('marks');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'marks'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-white/[0.06]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className={`w-4 h-4 ${activeTab === 'marks' ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>Marks</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                  Internals
                </span>
              </button>

              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <Clock className="w-4 h-4" />
                <span>Timetable</span>
              </div>

              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <CalendarCheck className="w-4 h-4" />
                <span>Exam timetable</span>
              </div>

              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <BookOpen className="w-4 h-4" />
                <span>Notes &amp; CGPA</span>
              </div>
            </div>
          </div>

          {/* Section: CAMPUS LIFE */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              Campus Life
            </span>
            <div className="space-y-0.5 pt-1">
              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <Sparkles className="w-4 h-4" />
                <span>Events</span>
              </div>
              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <Utensils className="w-4 h-4" />
                <span>Mess Menu</span>
              </div>
              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 cursor-not-allowed opacity-60">
                <Users className="w-4 h-4" />
                <span>Clubs &amp; Chapters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & Student Profile */}
        <div className="p-4 border-t border-white/[0.06] space-y-3 bg-[#0A0D14]">
          {/* Settings & Legal Row */}
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <button
              onClick={() => handleOpenSimulator()}
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>75% Rule</span>
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200 border border-white/[0.1] shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {studentName}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 truncate">
                  {registerNumber}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto lg:pl-64 min-w-0 w-full">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#0A0D14]/90 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <FolderTree className="w-4 h-4 text-zinc-500" />
              <span>Campus</span>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-semibold">
                {activeTab === 'marks' ? 'Internal Marks' : 'Attendance'}
              </span>
            </div>
          </div>

          {/* Right: Search bar & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block w-64 lg:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search or jump to..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.07] transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.06]">
                ⌘K
              </span>
            </div>

            {/* Re-Sync Button */}
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-xs font-semibold transition-all"
              title="Sync fresh attendance from SRM"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Re-Sync</span>
            </button>

            {/* Simulator Quick Action */}
            <button
              onClick={() => handleOpenSimulator('OVERALL')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {activeTab === 'marks' ? (
            <MarksView subjects={subjects} marks={data?.marks} />
          ) : (
            <>
              {/* Top Banner Notice matching the screenshot */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 pb-2">
                <p>
                  Milestones start tomorrow and assume attendance at upcoming scheduled periods.
                  Estimates follow your published planner.
                </p>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live SRM Verified
                  </span>
                </div>
              </div>

              {/* Quick Overall Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* KPI 1: Overall Percentage */}
                <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Overall Attendance
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span
                      className={`text-2xl font-black font-mono ${
                        (overall?.percentage || 0) >= 75
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {(overall?.percentage || 0).toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Target: 75%
                    </span>
                  </div>
                </div>

                {/* KPI 2: Total Classes */}
                <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Total Conducted
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black font-mono text-white">
                      {overall?.totalClasses || 0}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Across {subjects.length} courses
                    </span>
                  </div>
                </div>

                {/* KPI 3: Attended / Absent */}
                <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Present / Absent
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-black font-mono text-white">
                      <span className="text-emerald-400">{overall?.attendedClasses || 0}</span>
                      <span className="text-zinc-600 mx-1">/</span>
                      <span className="text-rose-400">{overall?.absentClasses || 0}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Ratio: {overall?.totalClasses ? ((overall.attendedClasses / overall.totalClasses) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>

                {/* KPI 4: Breathing Room Skips */}
                <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Safe Breathing Room
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span
                      className={`text-2xl font-black font-mono ${
                        (overall?.margin || 0) > 0 ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      {overall?.margin || 0}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      skips available
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Grid (2 columns on desktop matching the screenshot) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                    Registered Courses ({filteredSubjects.length})
                  </h2>

                  {searchQuery && (
                    <span className="text-xs text-cyan-400">
                      Filtering by "{searchQuery}" —{' '}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="underline hover:text-white"
                      >
                        Clear
                      </button>
                    </span>
                  )}
                </div>

                {filteredSubjects.length === 0 ? (
                  <div className="bg-[#121622] rounded-2xl border border-white/[0.08] p-12 text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">No courses matched</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      No registered subjects match your search term "{searchQuery}". Try clearing the search.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-white"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredSubjects.map((subject: any) => (
                      <SubjectCard
                        key={subject.subjectCode || subject.subjectName}
                        subject={subject}
                        onSimulate={handleOpenSimulator}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===================== SIMULATOR MODAL ===================== */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        subjects={subjects}
        overall={overall}
        initialCourseCode={simulatorSubjectCode}
      />
    </div>
  );
};
