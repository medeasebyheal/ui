import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setMsg('If this email exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="w-full flex-1 min-h-screen flex flex-col md:flex-row">
        {/* Left: gradient + form - full screen on mobile */}
        <section
          className="w-full md:w-1/2 min-h-screen md:min-h-0 p-6 sm:p-8 md:p-16 flex flex-col justify-center items-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}
        >
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 w-full max-w-md">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">Forgot password?</h1>
            <h2 className="text-3xl md:text-4xl font-semibold opacity-90 text-center">We&apos;ll send a reset link</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <p className="text-red-200 text-sm -mt-4">{error}</p>
              )}
              <div className="relative group">
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
                  id="email"
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-xs mx-auto block bg-[#1DE9B6] hover:bg-[#15D1A4] disabled:opacity-50 text-[#004D40] font-bold py-4 rounded-full shadow-lg shadow-black/10 transform active:scale-95 transition-all text-lg tracking-wide"
                >
                  {loading ? 'Sending…' : 'SEND RESET LINK'}
                </button>
              </div>
            </form>
            <div className="mt-12 text-center text-sm">
              <p className="opacity-80">
                Remembered your password?{' '}
                <Link to="/login" className="font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Right: branding - hidden on mobile */}
        <section className="hidden md:flex w-full md:w-1/2 bg-white dark:bg-slate-900 p-8 md:p-16 flex-col items-center justify-center text-center relative">
          <div className="hidden md:block absolute top-0 -left-12 h-full w-24 bg-white dark:bg-slate-900 rounded-[50%] z-0" />
          <div className="relative z-10 max-w-sm">
            <div className="flex items-center justify-center mb-8">
              <Link to="/" className="block">
                <img
                  src="/logo.png"
                  alt="MedEase - A project by HEAL"
                  className="h-20 w-auto object-contain max-w-full"
                />
              </Link>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-wide">
              YOUR PARTNER IN MEDICINE
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base font-medium">
              Making your study grind smoother, smarter, and less stressful! From module-wise quizzes to OSPE preps, we&apos;ve got your back!
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

