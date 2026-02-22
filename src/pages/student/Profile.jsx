import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    institution: '',
    year: '',
    rollNumber: '',
    batch: '',
  });

  useEffect(() => {
    if (user && editOpen) {
      setForm({
        name: user.name || '',
        contact: user.contact || '',
        institution: user.academicDetails?.institution || '',
        year: user.academicDetails?.year ?? '',
        rollNumber: user.academicDetails?.rollNumber || '',
        batch: user.academicDetails?.batch || '',
      });
      setError('');
    }
  }, [user, editOpen]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB.');
      return;
    }
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      await api.patch('/auth/profile-picture', form);
      await refreshUser();
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.patch('/auth/profile', {
        name: form.name.trim(),
        contact: form.contact.trim() || '',
        academicDetails: {
          institution: form.institution.trim() || '',
          year: form.year ? Number(form.year) : undefined,
          rollNumber: form.rollNumber.trim() || '',
          batch: form.batch.trim() || '',
        },
      });
      await refreshUser();
      setEditOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Student';
  const initial = (displayName[0] || 'S').toUpperCase();
  const username = user?.email?.split('@')[0] || displayName;
  const yearLabel = user?.academicDetails?.year
    ? `Medical Student • MS ${user.academicDetails.year} Year`
    : 'Medical Student';
  const institution = user?.academicDetails?.institution || '—';
  const rollNumber = user?.academicDetails?.rollNumber || '—';
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Profile</h1>
          <p className="text-slate-500">Manage your account settings and academic progress.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 relative transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentTime}</span>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
            <span className="text-sm text-slate-500">{currentDate}</span>
          </div>
        </div>
      </header>

      {/* Profile Dashboard Layout */}
      <div className="space-y-8">
        {/* User Identity Header Card */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-700 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-600 hover:text-primary transition-colors disabled:opacity-50"
                aria-label="Change photo"
              >
                <span className="material-symbols-outlined">{uploadingAvatar ? 'hourglass_empty' : 'camera_alt'}</span>
              </button>
            </div>
            {avatarError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 text-center max-w-[200px]">
                {avatarError}
              </p>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{displayName}</h2>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide flex items-center justify-center gap-1 w-fit ${
                  user?.isVerified
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{user?.isVerified ? 'check_circle' : 'schedule'}</span>
                {user?.isVerified ? 'Verified' : 'Pending verification'}
              </span>
            </div>
            <p className="text-slate-500 mb-4">{yearLabel}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition shadow-sm"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h3 className="font-bold text-slate-800 dark:text-white">Personal Information</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-500">person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Username</p>
                  <p className="text-slate-700 dark:text-slate-200 font-medium truncate">{username}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-500">mail</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email Address</p>
                  <p className="text-slate-700 dark:text-slate-200 font-medium break-all">{user?.email || '—'}</p>
                </div>
              </div>
              {user?.contact && (
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-500">phone</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Contact</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{user.contact}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-500">verified_user</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Account Status</p>
                  <p
                    className={`font-semibold ${
                      user?.isVerified
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {user?.isVerified ? 'Active & Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Details Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span>
              <h3 className="font-bold text-slate-800 dark:text-white">Academic Details</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-500">business</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Institution</p>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{institution}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-500">calendar_today</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Year</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                      {user?.academicDetails?.year != null
                        ? (() => {
                            const y = Number(user.academicDetails.year);
                            const suf = y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th';
                            return `${y}${suf} Year`;
                          })()
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-500">tag</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Roll #</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{rollNumber}</p>
                  </div>
                </div>
              </div>
              {user?.academicDetails?.batch && (
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-500">groups</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Batch</p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{user.academicDetails.batch}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscribed Packages Card */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              <h3 className="font-bold text-slate-800 dark:text-white">Subscribed Packages</h3>
            </div>
            <Link to="/student/packages" className="text-primary text-sm font-bold hover:underline">
              Browse More
            </Link>
          </div>
          <div className="p-6">
            {user?.packages?.length > 0 ? (
              <div className="space-y-4">
                {user.packages.map((up) => {
                  const pkg = up.package;
                  const approvedAt = up.approvedAt
                    ? new Date(up.approvedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : null;
                  return (
                    <div
                      key={up._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 dark:border-primary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                          <span className="material-symbols-outlined text-2xl text-primary">medical_services</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{pkg?.name || 'Package'}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {pkg?.description || 'Full access to subscribed modules.'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wide">
                          Active
                        </span>
                        {approvedAt && <p className="text-xs text-slate-400 mt-1">Approved: {approvedAt}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">
                  inventory_2
                </span>
                <p className="text-slate-500 dark:text-slate-400">No packages subscribed yet.</p>
                <Link to="/student/packages" className="inline-block mt-3 text-primary font-semibold hover:underline">
                  Browse packages
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Profile Dialog */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && setEditOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
              <button
                type="button"
                onClick={() => !saving && setEditOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                disabled={saving}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Phone or contact"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institution</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. JSMU"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roll #</label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Roll number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                <input
                  type="text"
                  value={form.batch}
                  onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Batch"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
