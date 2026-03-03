import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, LayoutDashboard, LogOut, Lock, LockOpen } from 'lucide-react';
import api from '../api/client';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(false);
  const [years, setYears] = useState([]);
  const [modulesByYear, setModulesByYear] = useState({});
  const profileRef = useRef(null);
  const modulesRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isHome = location?.pathname === '/';
    api
      .get('/content/years', { skipLoader: isHome })
      .then(({ data }) =>
        setYears(Array.isArray(data) ? data : Array.isArray(data?.years) ? data.years : [])
      )
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (!Array.isArray(years) || !years.length) return;
    Promise.all(
      years.map((y) =>
        api.get(`/content/years/${y._id}/modules`, { skipLoader: location.pathname === '/' }).then((r) => ({ yearId: y._id, yearName: y.name, modules: r.data }))
      )
    ).then((results) => {
      const next = {};
      results.forEach(({ yearId, yearName, modules }) => {
        next[yearId] = (modules || []).map((m) => ({ ...m, yearId, yearName }));
      });
      setModulesByYear(next);
    });
  }, [years]);

  const allModules = useMemo(() => Object.values(modulesByYear).flat(), [modulesByYear]);

  const allowedModuleIds = useMemo(() => {
    const ids = new Set();
    if (!user?.packages?.length) return ids;
    user.packages.forEach((up) => {
      const pkg = up.package;
      if (pkg?.moduleIds?.length) {
        pkg.moduleIds.forEach((id) => {
          const idStr =
            typeof id === 'object' && id != null && (id._id || id.toString) ? String(id._id || id) : String(id);
          if (idStr && idStr !== 'undefined') ids.add(idStr);
        });
      }
    });
    return ids;
  }, [user?.packages]);

  const displayName = user?.name || (user?.email && user.email.split('@')[0]) || 'User';
  const initial = (displayName || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const navLinks = (
    <>
      <Link
        to="/"
        className="text-gray-900 font-body text-sm lg:text-base px-4 py-2 rounded-full border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
      >
        Home
      </Link>
      <Link
        to="/about"
        className="text-gray-700 font-body text-sm lg:text-base hover:text-gray-900 transition-colors"
      >
        About Us
      </Link>
      <Link
        to="/packages"
        className="text-gray-700 font-body text-sm lg:text-base hover:text-gray-900 transition-colors"
      >
        Packages
      </Link>
      <div
        className="relative"
        ref={modulesRef}
        onMouseEnter={() => setModulesDropdownOpen(true)}
        onMouseLeave={() => setModulesDropdownOpen(false)}
      >
        <button
          type="button"
          className="text-gray-700 font-body text-sm lg:text-base hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          Modules
          <ChevronDown className={`w-4 h-4 transition-transform ${modulesDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {modulesDropdownOpen && (
          <div className="absolute left-0 top-full pt-1 py-1 min-w-[280px] max-h-[70vh] overflow-y-auto rounded-lg bg-white border border-gray-200 shadow-lg z-50">
            <Link
              to="/modules"
              onClick={() => setModulesDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-primary hover:bg-gray-50 border-b border-gray-100"
            >
              View all modules →
            </Link>
            {allModules.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">Loading...</p>
            ) : (
              allModules.map((mod) => {
                const modIdStr = mod._id != null ? String(mod._id) : '';
                const hasAccess = user && modIdStr && allowedModuleIds.has(modIdStr);
                const to = hasAccess ? `/student/modules/${mod._id}` : '/packages';
                return (
                  <Link
                    key={mod._id}
                    to={to}
                    onClick={() => setModulesDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="text-gray-400 flex-shrink-0">
                      {hasAccess ? (
                        <LockOpen className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium block truncate">{mod.name}</span>
                      {mod.yearName && (
                        <span className="text-xs text-gray-500">{mod.yearName}</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
      <Link
        to="/proff"
        className="text-gray-700 font-body text-sm lg:text-base hover:text-gray-900 transition-colors"
      >
        Proff
      </Link>
      <Link
        to="/contact"
        className="text-gray-700 font-body text-sm lg:text-base hover:text-gray-900 transition-colors"
      >
        Contact Us
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8 flex-1">
          {navLinks}
        </div>

        <div className="flex items-center justify-center flex-shrink-0">
          <Link to="/">
            <img
              src="/logo.png"
              alt="MedEase Logo"
              className="h-9 sm:h-10 md:h-11 lg:h-12 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">Hi, {displayName}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 min-w-[10rem] rounded-lg bg-white border border-gray-200 shadow-lg z-50">
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/student/resources'}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === 'admin' ? 'Admin' : 'Resources'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 font-body hover:text-gray-900 transition-colors text-sm lg:text-base"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary to-primary/90 text-white font-body font-semibold px-5 lg:px-6 py-2.5 rounded-lg hover:shadow-lg transition-all text-sm lg:text-base"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-gray-900 p-2 ml-4"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden container mx-auto px-4 sm:px-6 lg:px-8 mt-2 pb-3 space-y-3 border-t border-gray-200 pt-3">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            Home
          </Link>
          <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            About Us
          </Link>
          <Link to="/packages" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            Packages
          </Link>
          <Link to="/modules" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            Modules
          </Link>
          {allModules.length > 0 && (
            <div className="pl-4 space-y-1 border-l-2 border-gray-100">
              {allModules.map((mod) => {
                const modIdStr = mod._id != null ? String(mod._id) : '';
                const hasAccess = user && modIdStr && allowedModuleIds.has(modIdStr);
                const to = hasAccess ? `/student/modules/${mod._id}` : '/packages';
                return (
                  <Link
                    key={mod._id}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg"
                  >
                    {hasAccess ? (
                      <LockOpen className="w-4 h-4 text-primary" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="truncate">{mod.name}</span>
                    {mod.yearName && <span className="text-xs text-gray-400 flex-shrink-0">{mod.yearName}</span>}
                  </Link>
                );
              })}
            </div>
          )}
          <Link to="/proff" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            Proff
          </Link>
          <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 font-body hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
            Contact Us
          </Link>
          <div className="flex flex-col space-y-2 pt-2">
            {user ? (
              <div className="px-4 py-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Hi, {displayName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/student/resources'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === 'admin' ? 'Admin' : 'Resources'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 font-body hover:text-gray-900 py-2 px-4"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-gradient-to-r from-primary to-primary/90 text-white font-body font-semibold px-4 py-2.5 rounded-lg text-left"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
