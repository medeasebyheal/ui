import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  User,
  FileText,
  Menu,
  X,
  LogOut,
  Home,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { to: '/student', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/resources', end: false, label: 'My Resources', icon: BookOpen },
  { to: '/student/profile', end: false, label: 'Profile', icon: User },
  { to: '/student/payments', end: false, label: 'Payments', icon: FileText },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const headerProfileRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      const outside = !profileRef.current?.contains(e.target) && !headerProfileRef.current?.contains(e.target);
      if (outside) setProfileOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Student';
  const initial = (displayName[0] || 'S').toUpperCase();
  const yearLabel = user?.academicDetails?.year ? `MS ${user.academicDetails.year}` : 'Student';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-display">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-slate-200">
            <Link to="/student" className="flex items-center gap-2">
              <img src="/logo.png" alt="MedEase" className="h-9 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-800">MedEase</span>
            </Link>
            <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="Close sidebar">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 min-h-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-3 border-t border-slate-200" ref={profileRef}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20 ring-offset-2 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{yearLabel}</p>
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
              >
                <Home className="w-4 h-4" />
                Back to site
              </Link>
              <button
                type="button"
                onClick={() => { setSidebarOpen(false); logout(); window.location.href = '/'; }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white border-b border-slate-200 px-4 py-3 lg:px-8 flex-shrink-0">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="relative" ref={headerProfileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-3 pl-4 border-l border-slate-200"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{displayName}</span>
                <span className="text-xs text-slate-500">{yearLabel}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20 ring-offset-2 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 min-w-[10rem] rounded-xl bg-white border border-slate-200 shadow-lg z-50">
                <Link to="/student/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link to="/" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Home className="w-4 h-4" />
                  Back to site
                </Link>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); logout(); window.location.href = '/'; }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
