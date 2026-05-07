import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, BrainCircuit, Activity, 
  CalendarDays, Award, BookOpen, Clock, Search, 
  ChevronLeft, ChevronRight, BarChart, PieChart, 
  ChevronDown, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [mcqStats, setMcqStats] = useState([]);
  const [studentReports, setStudentReports] = useState([]);
  const [studentPagination, setStudentPagination] = useState({ page: 1, totalPages: 1 });
  const [studentSearch, setStudentSearch] = useState('');
  const [error, setError] = useState(null);

  const [dateFilter, setDateFilter] = useState('monthly'); 
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      let url = '/admin/analytics/kpi?';
      const now = new Date();
      let start = new Date();

      if (dateFilter === 'daily') start.setDate(now.getDate() - 1);
      else if (dateFilter === 'weekly') start.setDate(now.getDate() - 7);
      else if (dateFilter === 'monthly') start.setMonth(now.getMonth() - 1);
      else if (dateFilter === 'custom' && customStart && customEnd) {
        start = new Date(customStart);
        now.setTime(new Date(customEnd).getTime());
      }

      url += `startDate=${start.toISOString()}&endDate=${now.toISOString()}`;
      const res = await api.get(url);
      setData(res.data);
      
      // Also fetch advanced stats for trends
      const advRes = await api.get(`/admin/analytics/advanced?startDate=${start.toISOString()}&endDate=${now.toISOString()}`);
      setAdvancedData(advRes.data);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMcqStats = async () => {
    try {
      const res = await api.get('/admin/analytics/mcq-options');
      setMcqStats(res.data);
    } catch (_) {}
  };

  const fetchStudentReports = async (page = 1) => {
    try {
      const res = await api.get(`/admin/analytics/students?page=${page}&search=${studentSearch}`);
      setStudentReports(res.data.reports);
      setStudentPagination(res.data.pagination);
    } catch (_) {}
  };

  useEffect(() => {
    if (dateFilter !== 'custom' || (customStart && customEnd)) {
      fetchBaseData();
    }
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (activeTab === 'mcq') fetchMcqStats();
    if (activeTab === 'students') fetchStudentReports(studentPagination.page);
  }, [activeTab]);

  const handleStudentSearch = (e) => {
    e.preventDefault();
    fetchStudentReports(1);
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'trends', label: 'Yearly Trends', icon: BarChart },
    { id: 'mcq', label: 'MCQ Analytics', icon: PieChart },
    { id: 'students', label: 'Student Reports', icon: Users },
  ];

  return (
    <div className="mb-12 space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity className="w-6 h-6 text-primary" />
            Advanced Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && activeTab === 'overview' ? (
        <div className="flex justify-center py-12">
          <p className="animate-pulse text-slate-500 font-medium">Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
          {error}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && data && (
              <OverviewSection data={data} />
            )}
            {activeTab === 'trends' && advancedData && (
              <TrendsSection data={advancedData} />
            )}
            {activeTab === 'mcq' && (
              <McqStatsSection stats={mcqStats} />
            )}
            {activeTab === 'students' && (
              <StudentReportsSection 
                reports={studentReports} 
                pagination={studentPagination}
                search={studentSearch}
                setSearch={setStudentSearch}
                onSearch={handleStudentSearch}
                onPageChange={fetchStudentReports}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function OverviewSection({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={BarChart3} 
          label="MCQs Attempted" 
          value={data.totalMcqsAttempted} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          icon={BrainCircuit} 
          label="EaseGPT Usage" 
          value={data.easeGptUsage.total} 
          subText={`Standard: ${data.easeGptUsage.standard} | OSPE: ${data.easeGptUsage.ospe}`}
          color="bg-purple-50 text-purple-600" 
        />
        {data.topPerformer ? (
          <div className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-inner shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Top Performer</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{data.topPerformer.user?.name}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {data.topPerformer.mcqsAttempted}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {data.topPerformer.uniqueContentVisited}</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {data.topPerformer.streak}d</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <p className="text-slate-500 text-sm">No activity recorded</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList 
          title="Top Students by MCQs" 
          icon={Users} 
          items={data.topStudents.map(s => ({ name: s.name, sub: s.email, count: s.count }))}
          color="text-indigo-500"
          bg="bg-indigo-50"
        />
        <RankList 
          title="Most Attempted Topics" 
          icon={Activity} 
          items={data.topTopics.map(t => ({ name: t.name, count: t.count }))}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
      </div>
    </div>
  );
}

function TrendsSection({ data }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Year-wise Topic Visits
        </h3>
        <div className="space-y-4">
          {data.yearWiseVisits.map(y => (
            <div key={y._id} className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{y._id}</span>
                <span className="text-slate-500">{y.count} visits</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (y.count / 500) * 100)}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          ))}
          {data.yearWiseVisits.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No visit data for this period.</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-500" />
          Year-wise MCQ Accuracy
        </h3>
        <div className="space-y-4">
          {data.yearWiseAttempts.map(y => {
            const accuracy = y.count > 0 ? ((y.correct / y.count) * 100).toFixed(1) : 0;
            return (
              <div key={y._id} className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{y._id}</span>
                  <span className="text-slate-500">{accuracy}% Correct ({y.count} attempts)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            );
          })}
          {data.yearWiseAttempts.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No attempt data for this period.</p>}
        </div>
      </div>
    </div>
  );
}

function McqStatsSection({ stats }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          MCQ Selection Analytics
        </h3>
        <p className="text-sm text-slate-500 mt-1">Showing distribution of student choices for the most attempted questions.</p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {stats.map((mcq, idx) => (
          <div key={mcq._id} className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                {idx + 1}
              </span>
              <p className="text-slate-900 dark:text-white font-medium">{mcq.question}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-10">
              {mcq.options.sort((a,b) => a.index - b.index).map(opt => {
                const percent = ((opt.count / mcq.total) * 100).toFixed(0);
                const isCorrect = opt.index === mcq.correctIndex;
                return (
                  <div key={opt.index} className={`p-3 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Option {String.fromCharCode(65 + opt.index)} {isCorrect && '✓'}
                      </span>
                      <span className="text-xs font-bold">{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isCorrect ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {stats.length === 0 && <p className="p-12 text-center text-slate-500">No MCQ analytics data available.</p>}
      </div>
    </div>
  );
}

function StudentReportsSection({ reports, pagination, search, setSearch, onSearch, onPageChange }) {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm text-slate-900 dark:text-white"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MCQ Perf</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Spent</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {reports.map(s => (
                <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      {s.topicAttempts} Topics
                    </div>
                    <div className="text-[10px] text-slate-500">Streak: {s.studyStreakDays} days</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{s.accuracy}%</span>
                      <span className="text-[10px] text-slate-500">({s.mcqCount} MCQs)</span>
                    </div>
                    <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.accuracy}%` }} />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {Math.floor(s.totalTimeSeconds / 60)}m {s.totalTimeSeconds % 60}s
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedStudent(s)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                    >
                      View Full Report
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                  <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <ChevronDown className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Time</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {Math.floor(selectedStudent.totalTimeSeconds / 60)}m {selectedStudent.totalTimeSeconds % 60}s
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                    <p className="text-lg font-bold text-emerald-500">{selectedStudent.accuracy}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topics</p>
                    <p className="text-lg font-bold text-primary">{selectedStudent.topicAttempts}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                    Academic Year History
                  </h4>
                  {selectedStudent.yearWiseStats.map(y => (
                    <div key={y._id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{y._id}</span>
                        <span className="text-xs font-medium text-slate-500">{y.count} Topics Attempted</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, (y.avgScore / 10) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Avg Score: {y.avgScore.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                  {selectedStudent.yearWiseStats.length === 0 && (
                    <p className="text-center text-slate-400 py-8 italic">No year-wise activity recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 text-center">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="px-8 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subText, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {subText && <p className="text-xs text-slate-400 mt-1">{subText}</p>}
      </div>
    </div>
  );
}

function RankList({ title, icon: Icon, items, color, bg }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No data available.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full ${bg} ${color} flex items-center justify-center text-xs font-bold`}>{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{item.name}</p>
                  {item.sub && <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.sub}</p>}
                </div>
              </div>
              <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

