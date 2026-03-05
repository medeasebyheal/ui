import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, BookOpen, Stethoscope, HeartPulse, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: identifier.trim(), password });
      login(data.token, data.user);
      toast.success('Logged in');
      if (rememberMe) {
        try { localStorage.setItem('rememberMe', '1'); } catch {}
      }
      if (returnUrl && returnUrl.startsWith('/checkout') && data.user.role === 'student') {
        navigate(returnUrl);
      } else {
        navigate(data.user.role === 'admin' ? '/' : '/student/resources');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
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
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">Hi !</h1>
            <h2 className="text-3xl md:text-4xl font-semibold opacity-90 text-center">Welcome Back,</h2>
            <form onSubmit={handleSubmit} className="mt-16 space-y-8">
              {error && (
                <p className="text-red-200 text-sm -mt-4">{error}</p>
              )}
              <div className="relative group">
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
                  id="identifier"
                  name="identifier"
                  placeholder="Username, Email or Phone Number"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="relative group">
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-white/40 py-3 px-0 pr-10 text-white placeholder-white/60 focus:ring-0 focus:border-white transition-colors duration-300 outline-none"
                  id="password"
                  name="password"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-0 top-3 text-white/70 hover:text-white"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    className="rounded-full bg-transparent border-2 border-white/40 text-white focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer group-hover:border-white transition-all"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="opacity-90">Remember Me</span>
                </label>
                <Link className="opacity-90 hover:opacity-100 hover:underline transition-all" to="/forgot-password">Forgot Password?</Link>
              </div>
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-xs mx-auto block bg-[#1DE9B6] hover:bg-[#15D1A4] disabled:opacity-50 text-[#004D40] font-bold py-4 rounded-full shadow-lg shadow-black/10 transform active:scale-95 transition-all text-lg tracking-wide"
                >
                  {loading ? 'Logging in…' : 'LOGIN'}
                </button>
              </div>
            </form>
            <div className="mt-12 text-center text-sm">
              <p className="opacity-80">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-bold hover:underline">Register</Link>
              </p>
            </div>

            {/* Mobile back link below form */}
            <div className="md:hidden mt-6 text-center">
              <Link to="/" className="inline-flex items-center justify-center text-sm text-white font-medium gap-2">
                <Home className="w-4 h-4" />
                Back to website
              </Link>
            </div>
          </div>
        </section>

        {/* Right: branding - hidden on mobile, green only */}
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
            <div className="mt-12 flex justify-center gap-4 opacity-20 dark:opacity-40">
              <BookOpen className="w-10 h-10 text-slate-600 dark:text-slate-400" />
              <Stethoscope className="w-10 h-10 text-slate-600 dark:text-slate-400" />
              <HeartPulse className="w-10 h-10 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
