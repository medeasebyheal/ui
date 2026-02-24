import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f8] dark:bg-[#131f1e] font-display">
      {/* Desktop: show header with logo. Mobile: minimal header (logo replaced by green band below) */}
      <header className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MedEase" className="h-9 w-auto hidden md:block" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MedEase</h1>
        </Link>
        <div className="hidden sm:block">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Professional Exam Prep</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Desktop: left panel — logo on green-tinted background (hero-style) */}
        <div className="hidden md:flex md:w-[45%] lg:w-[50%] flex-shrink-0 items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 dark:from-primary/20 dark:via-primary/15 dark:to-primary/10">
          <div className="w-full max-w-md flex items-center justify-center">
            <img
              src="/logo.png"
              alt="A project by HEAL"
              className="w-full h-auto max-h-[280px] object-contain object-center"
            />
          </div>
        </div>

        {/* Right panel: form area */}
        <div
          className="flex-1 flex flex-col md:min-h-0"
          style={{
            backgroundColor: 'var(--auth-bg, #f6f8f8)',
            backgroundImage: 'radial-gradient(rgba(6,146,133,0.08) 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Mobile only: small logo at top (no background) */}
          <div className="md:hidden w-full py-6 px-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="A project by HEAL"
              className="h-10 w-auto max-w-[200px] object-contain object-center"
            />
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
