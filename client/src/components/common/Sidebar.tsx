import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  History,
  Settings,
  LogOut,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  onOpenPortalModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenPortalModal }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Subject-wise', path: '/subjects', icon: BookOpen },
    { name: 'What-If Calculator', path: '/calculator', icon: Calculator },
    { name: 'Attendance History', path: '/history', icon: History },
    { name: 'Profile & Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xl h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AttendWise
            </span>
            <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Smart Attendance
            </span>
          </div>
        </div>
      </div>

      {/* SRM Quick Sync Pill */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenPortalModal}
          className="w-full group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 transition-all text-xs font-semibold shadow-sm"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Sync SRM Portal</span>
          </div>
          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
            Live
          </span>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Settings Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
        {/* Theme and Target Badge */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Target: <strong className="text-slate-800 dark:text-slate-200">{user?.targetPercentage || 75}%</strong>
          </span>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.name || 'Student'}
            </p>
            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
              {user?.studentId || 'SRMIST'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

