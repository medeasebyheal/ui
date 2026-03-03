import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(searchParams.get('token') || '');
    setEmail(searchParams.get('email') || '');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, email, password });
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full flex-1 min-h-screen flex flex-col md:flex-row">
      <section
        className="w-full md:w-1/2 min-h-screen md:min-h-0 p-6 sm:p-8 md:p-16 flex flex-col justify-center items-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 w-full max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Set a new password</h1>
          <p className="text-2xl md:text-3xl font-semibold opacity-90 mb-6">Secure your account</p>
          <p className="text-white/90">Enter a strong password to update your account password.</p>
          {/* Mobile form (inside gradient) */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 md:hidden">
            {error && (
              <p className="text-red-200 text-sm -mt-4">{error}</p>
            )}
            <div>
              <input
                type="email"
                value={email}
                readOnly
                aria-readonly="true"
                placeholder="Email"
                className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="New password"
                className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
              />
            </div>
            <div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-xs mx-auto block bg-[#1DE9B6] hover:bg-[#15D1A4] disabled:opacity-50 text-[#004D40] font-bold py-4 rounded-full shadow-lg shadow-black/10 transform active:scale-95 transition-all text-lg tracking-wide"
              >
                {loading ? 'Saving…' : 'Save password'}
              </button>
            </div>
            <div className="mt-4 text-sm">
              <Link to="/login" className="text-white/90 underline">Back to login</Link>
            </div>
          </form>
        </div>
      </section>

      <section className="hidden md:flex w-full md:w-1/2 bg-white dark:bg-slate-900 p-8 md:p-16 flex-col items-center justify-center text-center relative">
        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            {error && <p className="text-red-600 text-left">{error}</p>}
            <input
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
              placeholder="Email"
              className="w-full bg-transparent border-0 border-b-2 border-slate-200 py-3 px-0 text-slate-900 placeholder-slate-400 focus:ring-0 focus:border-primary transition-colors duration-300 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="New password"
              className="w-full bg-transparent border-0 border-b-2 border-slate-200 py-3 px-0 text-slate-900 placeholder-slate-400 focus:ring-0 focus:border-primary transition-colors duration-300 outline-none"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Confirm password"
              className="w-full bg-transparent border-0 border-b-2 border-slate-200 py-3 px-0 text-slate-900 placeholder-slate-400 focus:ring-0 focus:border-primary transition-colors duration-300 outline-none"
            />
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-xs mx-auto block bg-[#1DE9B6] hover:bg-[#15D1A4] disabled:opacity-50 text-[#004D40] font-bold py-3 rounded-full shadow-lg transform active:scale-95 transition-all"
              >
                {loading ? 'Saving…' : 'Save password'}
              </button>
            </div>
            <div className="mt-6 text-sm">
              <Link to="/login" className="text-[#0D9488]">Back to login</Link>
            </div>
          </form>
        </div>
      </section>

      {/* mobile form moved into the gradient section above */}
    </main>
  );
}

