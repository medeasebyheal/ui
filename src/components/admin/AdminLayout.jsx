import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FolderTree,
  BookOpen,
  Package,
  Tag,
  Menu,
  X,
  LogOut,
  Home,
  ChevronDown,
  ChevronRight,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

const navItems = (isSuperAdmin) => [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', end: false, label: 'Users', icon: Users },
  ...(isSuperAdmin
    ? [
        { to: '/admin/payments', end: false, label: 'Payments', icon: CreditCard, showPendingDot: true },
        { to: '/admin/admins', end: true, label: 'Admins', icon: ShieldCheck },
      ]
    : []),
  {
    to: '/admin/resources',
    end: false,
    label: 'Resources',
    icon: FolderTree,
    children: [
      { to: '/admin/resources', end: true, label: 'Programs' },
      { to: '/admin/resources/years', end: true, label: 'Years' },
      { to: '/admin/resources/modules', end: true, label: 'Modules' },
      { to: '/admin/resources/subjects', end: true, label: 'Subjects' },
      { to: '/admin/resources/topics', end: true, label: 'Topics' },
    ],
  },
  {
    to: '/admin/proff',
    end: false,
    label: 'Proff',
    icon: BookOpen,
    children: [
      { to: '/admin/proff/jsmu', end: true, label: 'JSMU' },
      { to: '/admin/proff/other', end: true, label: 'Other University' },
    ],
  },
  { to: '/admin/packages', end: false, label: 'Packages', icon: Package },
  { to: '/admin/promo-codes', end: false, label: 'Promo Codes', icon: Tag },
  { to: '/admin/gemini-usage', end: true, label: 'Gemini Usage', icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [proffExpanded, setProffExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const profileRef = useRef(null);
  const headerProfileRef = useRef(null);
  const location = useLocation();
  const isOnResources = location.pathname.startsWith('/admin/resources');
  const isOnProff = location.pathname.startsWith('/admin/proff');

  useEffect(() => {
    if (!isSuperAdmin) {
      setPendingPaymentsCount(0);
      return;
    }
    api.get('/admin/dashboard').then(({ data }) => {
      const n = data?.pendingPayments ?? 0;
      setPendingPaymentsCount(typeof n === 'number' ? n : 0);
    }).catch(() => setPendingPaymentsCount(0));
  }, [location.pathname, isSuperAdmin]);

  useEffect(() => {
    if (isOnResources) setResourcesExpanded(true);
    if (isOnProff) setProffExpanded(true);
  }, [isOnResources, isOnProff]);

  useEffect(() => {
    function handleClickOutside(e) {
      const outside = !profileRef.current?.contains(e.target) && !headerProfileRef.current?.contains(e.target);
    if (outside) setProfileOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Admin';
  const initial = (displayName[0] || 'A').toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - full viewport height (100vh) */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-gray-700">
            <Link to="/admin" className="flex items-center gap-2 font-heading font-bold text-lg">
              <span className="text-primary">MEDEASE</span>
              <span className="text-gray-400 text-sm">Admin</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 min-h-0">
            {navItems(isSuperAdmin).map((item) => {
              if (item.children) {
                const isActive = item.children.some(
                  (c) => location.pathname === c.to || (c.to !== item.to && location.pathname.startsWith(c.to))
                );
                const isExpanded = item.to === '/admin/resources' ? resourcesExpanded : proffExpanded;
                const setExpanded = item.to === '/admin/resources' ? setResourcesExpanded : setProffExpanded;
                return (
                  <div key={item.to}>
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => !e)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {item.label}
                      <span className="ml-auto">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="mt-1 ml-3 pl-3 border-l border-gray-600 space-y-0.5">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive: active }) =>
                              `flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                                active
                                  ? 'bg-primary/80 text-white'
                                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              const Icon = item.icon;
              const showDot = item.showPendingDot && pendingPaymentsCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                  {showDot && (
                    <span
                      className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0"
                      title={`${pendingPaymentsCount} pending payment${pendingPaymentsCount !== 1 ? 's' : ''}`}
                      aria-hidden
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-3 border-t border-gray-700" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Hi, {displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="mt-1 py-1 rounded-lg bg-gray-800 border border-gray-700 shadow-lg overflow-hidden">
                <Link
                  to="/"
                  onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Home className="w-4 h-4 flex-shrink-0" />
                  Back to site
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setSidebarOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-200"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content - offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white border-b border-gray-200 px-4 py-3 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <p className="text-sm text-gray-500 font-body">Admin Panel</p>
          </div>
          <div className="relative" ref={headerProfileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Hi, {displayName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 min-w-[10rem] rounded-lg bg-white border border-gray-200 shadow-lg z-50">
                <Link
                  to="/"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Home className="w-4 h-4" />
                  Back to site
                </Link>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); logout(); navigate('/login', { replace: true }); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 text-left"
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
