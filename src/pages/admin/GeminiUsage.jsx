import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, AlertTriangle, RefreshCw, MessageCircle, Calendar, Key, Database, Info, Download, ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

function todayUTCDateString() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function GeminiUsage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayUTCDateString());
  const [page, setPage] = useState(1);
  const [limit] = useState(200);

  const fetchLogs = (d = date, p = page) => {
    if (user?.role !== 'superadmin') return;
    setLoading(true);
    api
      .get(`/admin/gemini-usage/logs?date=${d}&page=${p}&limit=${limit}`)
      .then(({ data: res }) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user == null) return;
    if (user.role !== 'superadmin') {
      navigate('/admin', { replace: true });
      setLoading(false);
      return;
    }
    fetchLogs(date, page);
    const interval = setInterval(() => fetchLogs(date, page), 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, date, page]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 font-medium animate-pulse">Loading usage...</p>
      </div>
    );
  }

  if (user && user.role !== 'superadmin') {
    return null;
  }

  const keys = (data?.summary?.keys) ?? [];
  const totals = data?.summary?.totals ?? { requests: 0, tokens: 0 };
  const openai = data?.summary?.openai ?? { requestsToday: 0, tokensToday: 0 };
  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 transition-colors">
      <div className="  ">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Metrics</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight">API Usage <span className="text-slate-400 dark:text-slate-500">— Gemini & OpenAI</span></h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl">Real-time daily log monitoring for Gemini and OpenAI API integrations. Persistent call logs synchronized with MongoDB.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm">
              <Calendar className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                  fetchLogs(e.target.value, 1);
                }}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
              />
            </div>
            <button
              onClick={() => fetchLogs(date, page)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div className="rounded-2xl p-8 xl:col-span-2 relative overflow-hidden bg-white dark:bg-slate-800 shadow-sm border">
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold">API Keys Overview</h3>
                  </div>
                  <span className="bg-teal-500/10 text-teal-600 px-3 py-1 rounded-full text-xs font-bold border border-teal-500/20">
                    Showing {keys.length} configured key{keys.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {keys.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border col-span-3 text-sm text-slate-500">
                      No API keys configured.
                    </div>
                  ) : (
                    keys.map((key) => {
                      const exhausted = key.exhausted;
                      return (
                        <div
                          key={key.keyIndex}
                          className={`p-4 rounded-2xl ${exhausted ? 'bg-rose-50/20 border-rose-200 dark:border-rose-800/50' : 'bg-slate-50 dark:bg-slate-900/40 border'} border`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">{key.label}</div>
                            <div className={`text-xs font-semibold px-2 py-0.5 rounded ${exhausted ? 'text-rose-700 bg-rose-100 dark:bg-rose-900/30' : 'text-green-700 bg-green-100 dark:bg-green-900/30'}`}>
                              {exhausted ? 'Over limit' : 'OK'}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">RPM</div>
                          <div className={`font-semibold ${key.rpm >= key.limits.rpm ? 'text-rose-600' : ''}`}>{key.rpm ?? 0} / {key.limits.rpm}</div>
                          <div className="text-xs text-slate-500 mt-2">TPM</div>
                          <div className={`font-semibold ${key.tpm >= key.limits.tpm ? 'text-rose-600' : ''}`}>{(key.tpm ?? 0).toLocaleString()} / {key.limits.tpm.toLocaleString()}</div>
                          <div className="text-xs text-slate-500 mt-2">RPD</div>
                          <div className={`font-semibold ${key.rpd >= key.limits.rpd ? 'text-rose-600' : ''}`}>{key.rpd ?? 0} / {key.limits.rpd}</div>
                          <div className="text-xs text-slate-500 mt-3">Tokens today</div>
                          <div className="font-bold text-lg">{(key.tokens ?? 0).toLocaleString()}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center md:border-l border-slate-200 dark:border-slate-700/50 md:pl-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-200 dark:text-slate-800" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                    <circle className="text-primary progress-ring-circle" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={String(251.2 - (Math.min(100, ((totals.requests ?? 0) / ((keys.length || 1) * 20)) * 100) / 100) * 251.2)} strokeLinecap="round" strokeWidth="8"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold font-display leading-none">{Math.round(Math.min(100, ((totals.requests ?? 0) / ((keys.length || 1) * 20)) * 100))}%</span>
                    <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold mt-1">Quota</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-3 uppercase tracking-widest">Last 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl p-8 bg-white dark:bg-slate-800 shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold">Gemini Totals</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Requests</p>
                    <p className="text-xl font-display font-bold">{totals.requests ?? 0}</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, ((totals.requests ?? 0) / ((keys.length || 1) * 20)) * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tokens</p>
                    <p className="text-xl font-display font-bold">{(totals.tokens ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((totals.tokens ?? 0) / Math.max(1, (keys.reduce((s,k)=>s+(k.limits?.tpm||250000),0))) ) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Info className="w-4 h-4" />
                  <span>Per-day (UTC), from logs</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-8 bg-white dark:bg-slate-800 shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold">OpenAI Usage</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Requests Today</p>
                    <p className="text-xl font-display font-bold">{openai.requestsToday ?? 0}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tokens Today</p>
                    <p className="text-xl font-display font-bold">{(openai.tokensToday ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Info className="w-4 h-4" />
                  <span>EaseGPT + MCQ parse (in-memory, resets on restart)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border mb-10">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-display font-bold">Raw Activity Logs</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // export current page CSV
                  const rows = (data?.entries || []).map((e) => ({
                    timestamp: e.timestamp,
                    key: `Key ${e.keyIndex + 1}`,
                    tokens: e.tokens ?? 0,
                    source: (e.meta && e.meta.source) || '',
                    meta: JSON.stringify(e.meta || {}),
                  }));
                  const header = ['timestamp', 'key', 'tokens', 'source', 'meta'];
                  const csv = [header.join(',')]
                    .concat(rows.map((r) => header.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `gemini-logs-${date}-page-${data?.page || page}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time (UTC)</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time (Local)</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">API Key</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Tokens</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Source</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {entries.length === 0 ? (
                  <tr>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500 italic" colSpan={6}>No records for this period.</td>
                  </tr>
                ) : (
                  entries.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-300">{new Date(e.timestamp).toISOString()}</td>
                      <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-mono">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">{`Key ${e.keyIndex + 1}`}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-display font-bold text-right text-slate-700 dark:text-slate-200">{(e.tokens ?? 0).toLocaleString()}</td>
                      <td className="px-8 py-5 text-sm text-slate-400">{(e.meta && e.meta.source) || '-'}</td>
                      <td className="px-8 py-5 text-center">
                        <button
                          onClick={() => {
                            // open modal or alert with JSON
                            alert(JSON.stringify(e.meta || {}, null, 2));
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                        >
                          <ArrowRight className="w-4 h-4" />
                          VIEW JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Showing {(data?.page || page) === 0 ? 0 : ((data?.page - 1) * (data?.limit || limit) + 1)} to {Math.min((data?.page || page) * (data?.limit || limit), data?.totalEntries ?? 0)} of {data?.totalEntries ?? 0} entries</span>
            <div className="flex items-center gap-2">
              <button
                disabled={(data?.page || page) <= 1}
                onClick={() => {
                  const np = Math.max(1, (data?.page || page) - 1);
                  setPage(np);
                  fetchLogs(date, np);
                }}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs px-4">{data?.page ?? page}</div>
              <button
                disabled={(data?.page || page) >= (data?.totalPages ?? 1)}
                onClick={() => {
                  const np = Math.min((data?.totalPages ?? 1), (data?.page || page) + 1);
                  setPage(np);
                  fetchLogs(date, np);
                }}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-auto pt-4 flex items-center justify-between text-slate-400 text-xs font-medium">
          <p>Logs are stored per-day (UTC) and retained in MongoDB. MedEase</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-primary transition-colors" href="#">System Status</a>
            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <a className="hover:text-primary transition-colors" href="#">API Documentation</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
