import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { toast } from 'react-hot-toast';

const WAVE_SVG = (
  <svg className="w-64 h-auto text-primary" fill="none" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 50C20 50 30 20 50 20C70 20 80 80 100 80C120 80 130 50 150 50C170 50 180 80 200 80" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [form, setForm] = useState({ name: '', email: '', password: '', contact: '', university: '', college: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { toast.error('Full Name is required'); return; }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) { toast.error('A valid Email Address is required'); return; }
    if (!form.contact.trim()) { toast.error('Contact number is required'); return; }
    const contactDigits = form.contact.replace(/\D/g, '');
    if (contactDigits.length < 10) { toast.error('Enter a valid contact number'); return; }
    if (!form.university.trim()) { toast.error('University is required'); return; }
    if (!form.password) { toast.error('Password is required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    if (form.password !== confirmPassword) {
      toast.error('Passwords do not match.');
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      if (data.pendingVerification) {
        setPendingVerification(true);
        toast.success('Verification code sent to your email');
      } else {
        login(data.token, data.user);
        toast.success('Welcome!');
        if (returnUrl && returnUrl.startsWith('/checkout')) {
          navigate(returnUrl);
        } else {
          navigate('/student/resources');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { ...form, otp });
      login(data.token, data.user);
      toast.success('Account verified');
      if (returnUrl && returnUrl.startsWith('/checkout')) {
        navigate(returnUrl);
      } else {
        navigate('/student/resources');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Verification failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPendingVerification(false);
    setOtp('');
    setError('');
  };

  if (pendingVerification) {
    return (
      <main className="w-full flex-1 min-h-screen flex flex-col lg:flex-row">
        {/* Left: gradient + verify card - same as signup */}
        <div
          className="w-full lg:w-1/2 min-h-screen lg:min-h-0 p-6 sm:p-8 lg:p-16 flex flex-col justify-center items-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}
        >
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 w-full max-w-md">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium mb-8 transition-colors"
              aria-label="Use a different email"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Verify your email
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                We sent a 6-digit code to{' '}
                <strong className="text-slate-800 dark:text-slate-200">{form.email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
                {error && (
                  <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Enter verification code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="block w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-center text-xl tracking-[0.4em] font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-primary hover:bg-teal-700 text-white font-bold py-4 px-4 rounded-full shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify and create account'}
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: branding - same as signup */}
        <div className="hidden lg:flex w-full lg:w-1/2 p-12 lg:p-20 flex-col items-center justify-center text-center bg-white dark:bg-slate-900 relative">
          <div className="hidden lg:block absolute top-0 -left-12 h-full w-24 bg-white dark:bg-slate-900 rounded-[50%] z-0" />
          <div className="relative z-10 mb-12 flex justify-center w-full max-w-sm">
            <Link to="/" className="block">
              <img
                src="/logo.png"
                alt="MedEase - A project by HEAL"
                className="h-20 w-auto object-contain max-w-full"
              />
            </Link>
          </div>
          <div className="relative z-10 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
              YOUR PARTNER IN MEDICINE
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Making your study grind smoother, smarter, and less stressful! From module-wise quizzes to OSPE preps, we&apos;ve got your back!
            </p>
          </div>
          <div className="relative z-10 mt-16 opacity-20 dark:opacity-10">
            {WAVE_SVG}
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="w-full flex-1 min-h-screen flex flex-col lg:flex-row transition-colors duration-300">
        {/* Left: gradient + form - full screen on mobile */}
        <div
          className="w-full lg:w-1/2 min-h-screen lg:min-h-0 p-6 sm:p-8 lg:p-16 flex flex-col justify-center items-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #26D0CE 0%, #1A938F 50%, #0D5C58 100%)' }}
        >
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 w-full max-w-md">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 leading-tight text-center lg:text-left">
              Join Us !
            </h1>
            <p className="text-teal-50 font-medium mb-10 text-lg text-center lg:text-left">Create your account to get started.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="text-red-200 text-sm -mt-2">{error}</p>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Full Name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    autoComplete="name"
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Email Address"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Contact Number"
                    type="tel"
                    required
                    inputMode="tel"
                    value={form.contact}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    autoComplete="tel"
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="University"
                    type="text"
                    required
                    value={form.university}
                    onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Medical College"
                    type="text"
                    value={form.college}
                    onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 pr-10 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-3 text-white/70 hover:text-white"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/70 py-3 px-1 focus:outline-none focus:border-white transition-all duration-300 rounded-none text-lg"
                    placeholder="Confirm Password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-8 bg-white text-primary font-bold text-xl rounded-full hover:bg-teal-50 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'SIGN UP'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/80 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-white font-bold hover:underline ml-1">
                  Log in
                </Link>
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
        </div>

        {/* Right: branding - hidden on mobile, green only */}
        <div className="hidden lg:flex w-full lg:w-1/2 p-12 lg:p-20 flex-col items-center justify-center text-center bg-white dark:bg-slate-900 transition-colors duration-300 relative">
          <div className="hidden lg:block absolute top-0 -left-12 h-full w-24 bg-white dark:bg-slate-900 rounded-[50%] z-0" />
          <div className="relative z-10 mb-12 flex justify-center w-full max-w-sm">
            <Link to="/" className="block">
              <img
                src="/logo.png"
                alt="MedEase - A project by HEAL"
                className="h-20 w-auto object-contain max-w-full"
              />
            </Link>
          </div>
          <div className="relative z-10 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
              YOUR PARTNER IN MEDICINE
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Making your study grind smoother, smarter, and less stressful! From module-wise quizzes to OSPE preps, we&apos;ve got your back!
            </p>
          </div>
          <div className="relative z-10 mt-16 opacity-20 dark:opacity-10">
            {WAVE_SVG}
          </div>
        </div>
      </main>
    </>
  );
}
