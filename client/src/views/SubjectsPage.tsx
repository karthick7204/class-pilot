import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Subject } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SAFE' | 'WARNING' | 'CRITICAL'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    teacherName: '',
    totalClasses: 0,
    attendedClasses: 0,
    targetOverride: '',
  });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      subjectName: '',
      subjectCode: '',
      teacherName: '',
      totalClasses: 0,
      attendedClasses: 0,
      targetOverride: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({
      subjectName: sub.subjectName,
      subjectCode: sub.subjectCode || '',
      teacherName: sub.teacherName || '',
      totalClasses: sub.totalClasses,
      attendedClasses: sub.attendedClasses,
      targetOverride: sub.targetOverride ? String(sub.targetOverride) : '',
    });
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectName.trim()) return;

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, formData);
      } else {
        await api.post('/subjects', formData);
      }
      setIsAddModalOpen(false);
      setEditingSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save subject.');
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.delete(`/subjects/${id}`);
        await fetchSubjects();
      } catch (err) {
        console.error('Error deleting subject:', err);
      }
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subjectCode && s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  const target = user?.targetPercentage || 75.0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Subject-wise Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time margin, shortages, and required class counts for each registered course
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject name, code, or faculty..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SAFE', 'WARNING', 'CRITICAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL'
                ? 'All Subjects'
                : st === 'SAFE'
                ? 'Safe Zone'
                : st === 'WARNING'
                ? 'Warning (Near 75%)'
                : 'Critical Shortage'}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No subjects found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or filters.'
              : 'Add a new subject or click "Sync SRM Portal" to import from your college portal.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubjects.map((sub) => {
            const subTarget = sub.targetOverride || target;
            const isSafe = sub.percentage >= subTarget;

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500/50 transition-all"
              >
                <div>
                  {/* Top Bar: Code, Target Override, Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono border border-current"
                      >
                        {sub.subjectCode || 'COURSE'}
                      </span>
                      {sub.teacherName && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {sub.teacherName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        title="Edit Subject"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.subjectName)}
                        title="Delete Subject"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Percentage */}
                  <div className="flex items-baseline justify-between gap-4 mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {sub.subjectName}
                    </h3>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-2xl font-extrabold ${
                          isSafe
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with Target Marker */}
                  <div className="relative mb-4">
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, sub.percentage)}%`,
                          backgroundColor: isSafe ? '#10b981' : '#ef4444',
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    {/* Target baseline mark */}
                    <div
                      style={{ left: `${subTarget}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      title={`Target: ${subTarget}%`}
                    />
                  </div>

                  {/* Metrics Table */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-center mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total (T)</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {sub.totalClasses}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Attended (A)</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {sub.attendedClasses}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Absent</p>
                      <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                        {sub.absentClasses}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Highlight: Leave Margin or Required */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  {sub.requiredClasses === 0 ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Safe Margin:{' '}
                        <strong>
                          {sub.margin} class{sub.margin !== 1 ? 'es' : ''} can be skipped
                        </strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Recovery:{' '}
                        <strong>
                          Attend {sub.requiredClasses} consecutive class
                          {sub.requiredClasses !== 1 ? 'es' : ''}
                        </strong>
                      </span>
                    </div>
                  )}

                  <StatusBadge status={sub.status} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {(isAddModalOpen || editingSubject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSubject(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  placeholder="e.g. Design and Analysis of Algorithms"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    placeholder="e.g. 21CSC302J"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Faculty (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="e.g. Dr. Ramesh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Classes Conducted (T)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalClasses}
                    onChange={(e) =>
                      setFormData({ ...formData, totalClasses: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Classes Attended (A)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalClasses}
                    value={formData.attendedClasses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendedClasses: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
                >
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

