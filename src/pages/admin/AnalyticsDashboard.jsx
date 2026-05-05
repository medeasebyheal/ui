import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BrainCircuit, Activity, CalendarDays, Award, BookOpen } from 'lucide-react';
import api from '../../api/client';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [dateFilter, setDateFilter] = useState('monthly'); // daily, weekly, monthly, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchKpiData = async () => {
    setLoading(true);
    try {
      let url = '/admin/analytics/kpi?';
      const now = new Date();
      let start = new Date();

      if (dateFilter === 'daily') {
        start.setDate(now.getDate() - 1);
      } else if (dateFilter === 'weekly') {
        start.setDate(now.getDate() - 7);
      } else if (dateFilter === 'monthly') {
        start.setMonth(now.getMonth() - 1);
      } else if (dateFilter === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return; // Wait for valid custom dates
        }
        start = new Date(customStart);
        now.setTime(new Date(customEnd).getTime());
      }

      url += `startDate=${start.toISOString()}&endDate=${now.toISOString()}`;

      const res = await api.get(url);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter !== 'custom' || (customStart && customEnd)) {
      fetchKpiData();
    }
  }, [dateFilter, customStart, customEnd]);

  return (
    <div className="mb-12 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-slate-900">
          <TrendingUp className="w-6 h-6 text-primary" />
          KPI & Analytics
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="daily">Daily (Last 24h)</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
            <option value="monthly">Monthly (Last 30 Days)</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-primary focus:border-primary outline-none"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="animate-pulse text-slate-500 font-medium">Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">MCQs Attempted</p>
                <p className="text-3xl font-bold text-slate-900">{data.totalMcqsAttempted}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">EaseGPT Total Usage</p>
                <p className="text-3xl font-bold text-slate-900">{data.easeGptUsage.total}</p>
                <p className="text-xs text-slate-400 mt-1">Standard: {data.easeGptUsage.standard} | OSPE: {data.easeGptUsage.ospe}</p>
              </div>
            </div>

            {/* Top Performer Highlights */}
            {data.topPerformer ? (
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Top Performer</p>
                  <p className="text-lg font-bold text-slate-900 truncate">{data.topPerformer.user?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                    <span title="MCQs" className="flex items-center gap-1"><Activity className="w-4 h-4" /> {data.topPerformer.mcqsAttempted}</span>
                    <span title="Unique Content Visited" className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {data.topPerformer.uniqueContentVisited}</span>
                    <span title="Streak" className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {data.topPerformer.streak}d</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                <p className="text-slate-500 text-sm">No activity recorded</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 5 Students */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Top Students by MCQs
              </h3>
              {data.topStudents.length === 0 ? (
                <p className="text-sm text-slate-500">No data available.</p>
              ) : (
                <ul className="space-y-4">
                  {data.topStudents.map((s, i) => (
                    <li key={s._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{s.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{s.email}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Most Attempted MCQ Topics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Most Attempted Topics
              </h3>
              {data.topTopics.length === 0 ? (
                <p className="text-sm text-slate-500">No data available.</p>
              ) : (
                <ul className="space-y-4">
                  {data.topTopics.map((t, i) => (
                    <li key={t._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{t.name || 'Unknown'}</p>
                      </div>
                      <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Most Visited Content */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                Most Visited Content
              </h3>
              {data.mostVisitedContent.length === 0 ? (
                <p className="text-sm text-slate-500">No visits tracked yet.</p>
              ) : (
                <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.mostVisitedContent.map((v, i) => (
                    <li key={v.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{v.name}</p>
                          <p className="text-xs text-slate-500 uppercase font-medium">{v.type}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{v.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
