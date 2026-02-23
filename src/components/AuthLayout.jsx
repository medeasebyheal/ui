import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f8] dark:bg-[#131f1e] font-display">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MedEase" className="h-9 w-auto" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">MedEase</h1>
        </Link>
        <div className="hidden sm:block">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Professional Exam Prep</p>
        </div>
      </header>
      <main
        className="flex-1 flex items-center justify-center p-4 md:p-6"
        style={{
          backgroundColor: 'var(--auth-bg, #f6f8f8)',
          backgroundImage: 'radial-gradient(rgba(6,146,133,0.08) 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
