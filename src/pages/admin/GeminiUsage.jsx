import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

export default function GeminiUsage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);


  const fetchUsage = () => {
    if (user?.role !== 'superadmin') return;
    api
      .get('/admin/gemini-usage')
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
    setLoading(true);
    fetchUsage();
    const interval = setInterval(() => {
      api
        .get('/admin/gemini-usage')
        .then(({ data: res }) =>
          setData((prev) => {
            if (!prev) return res;

            const prevKeys = prev.keys ?? [];
            const newKeys = res.keys ?? [];

            const mergedKeys = newKeys.map((nk) => {
              const pk = prevKeys.find((p) => p.keyIndex === nk.keyIndex) || {};
              return {
                ...nk,
                // keep the highest seen requests-per-day so RPD only grows during the day
                rpd: Math.max(pk.rpd ?? 0, nk.rpd ?? 0),
              };
            });
            // include any previous keys that are missing from the new payload
            prevKeys.forEach((pk) => {
              if (!mergedKeys.find((m) => m.keyIndex === pk.keyIndex)) {
                mergedKeys.push(pk);
              }
            });

            const prevTotals = prev.totals ?? { requestsToday: 0, tokensToday: 0 };
            const newTotals = res.totals ?? { requestsToday: 0, tokensToday: 0 };
            const mergedTotals = {
              requestsToday: Math.max(prevTotals.requestsToday ?? 0, newTotals.requestsToday ?? 0),
              tokensToday: Math.max(prevTotals.tokensToday ?? 0, newTotals.tokensToday ?? 0),
            };

            const prevEase = prev.easegpt ?? { requestsToday: 0, tokensToday: 0 };
            const newEase = res.easegpt ?? { requestsToday: 0, tokensToday: 0 };
            const mergedEase = {
              requestsToday: Math.max(prevEase.requestsToday ?? 0, newEase.requestsToday ?? 0),
              tokensToday: Math.max(prevEase.tokensToday ?? 0, newEase.tokensToday ?? 0),
            };

            return { ...res, keys: mergedKeys, totals: mergedTotals, easegpt: mergedEase };
          })
        )
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 font-medium animate-pulse">Loading usage...</p>
      </div>
    );
  }

  const keys = data?.keys ?? [];
  const totals = data?.totals ?? { requestsToday: 0, tokensToday: 0 };
  const easegpt = data?.easegpt ?? { requestsToday: 0, tokensToday: 0 };
  const anyExhausted = keys.some((k) => k.exhausted);

  if (user && user.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          API Usage
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Usage for bulk MCQ parsing and EaseGPT. Limits per key: 10 requests/min, 250K tokens/min, 20 requests/day. Keys rotate (round-robin) so no single key is overused. &quot;Today&quot; is UTC.
        </p>
      </div>

      {anyExhausted && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">One or more API keys have reached their limit.</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Bulk MCQ parsing may use the manual parser until limits reset (per-minute limits reset after 60 seconds; daily limit resets at midnight UTC).
            </p>
            <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
              {keys.filter((k) => k.exhausted).map((k) => (
                <li key={k.keyIndex}>
                  {k.label}: {k.exhaustedReasons?.join(', ') || 'Limit reached'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {keys.map((key) => (
          <div
            key={key.keyIndex}
            className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border flex flex-col ${
              key.exhausted ? 'border-amber-200 dark:border-amber-800/50' : 'border-slate-100 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{key.label}</h3>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  key.exhausted ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {key.exhausted ? 'Exhausted' : 'OK'}
              </span>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Requests this minute (RPM)</dt>
                <dd className="font-semibold text-slate-800 dark:text-white">
                  {key.rpm} / {key.limits.rpm}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Tokens this minute (TPM)</dt>
                <dd className="font-semibold text-slate-800 dark:text-white">
                  {key.tpm.toLocaleString()} / {key.limits.tpm.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Requests today (RPD)</dt>
                <dd className="font-semibold text-slate-800 dark:text-white">
                  {key.rpd} / {key.limits.rpd}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Totals (all keys) — Bulk parse + EaseGPT</h3>
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total requests today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totals.requestsToday ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total tokens today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{(totals.tokensToday ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          EaseGPT usage
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Student quiz chat (AI explanations). Same API keys; counts reset daily (UTC).
        </p>
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Requests today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{easegpt.requestsToday ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tokens today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{(easegpt.tokensToday ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-4 h-4" />
        <span>Refreshes every 60 seconds.</span>
      </div>
    </div>
  );
}
