import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Mail } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [form, setForm] = useState({ name: '', email: '', password: '', contact: '' });
  const [otp, setOtp] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      if (data.pendingVerification) {
        setPendingVerification(true);
      } else {
        login(data.token, data.user);
        if (returnUrl && returnUrl.startsWith('/checkout')) {
          navigate(returnUrl);
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { ...form, otp });
      login(data.token, data.user);
      if (returnUrl && returnUrl.startsWith('/checkout')) {
        navigate(returnUrl);
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Verification failed');
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
      <section className="py-12 sm:py-16 container mx-auto px-4 flex justify-center items-center min-h-[60vh]">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Verify your email</h1>
            <p className="text-gray-600 mt-1 text-sm">
              We sent a 6-digit code to <strong>{form.email}</strong>
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter verification code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-heading font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and create account'}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-gray-600 text-sm hover:text-gray-900"
            >
              Use a different email
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 container mx-auto px-4 flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">Sign up</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 6)</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (optional)</label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-heading font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Sending code...' : 'Sign up'}
          </button>
          <p className="text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
