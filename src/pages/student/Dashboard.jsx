import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, BarChart3, CreditCard, Calendar, PlayCircle, Info } from 'lucide-react';
import { getRecentViews } from '../../utils/recentViews';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recentView, setRecentView] = useState(null);

  useEffect(() => {
    const views = getRecentViews();
    setRecentView(views[0] || null);
  }, []);

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Student';
  const hasPackages = !!user?.packages?.length;
  const firstPackage = user?.packages?.[0]?.package;
  const packageName = firstPackage?.name || 'Package';

  const continueLearning = recentView
    ? {
        title: recentView.name,
        subject: recentView.meta || (recentView.type === 'module' ? 'Module' : recentView.type === 'topic' ? 'Topic' : recentView.type === 'ospe' ? 'OSPE' : 'Resource'),
        description: 'Pick up where you left off and continue your learning.',
        url: recentView.url,
        imageUrl: FALLBACK_IMAGE,
      }
    : {
        title: 'Explore your modules',
        subject: 'Get Started',
        description: 'Open Resources to browse topics, subjects, and OSPEs.',
        url: '/student/resources',
        imageUrl: FALLBACK_IMAGE,
      };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Info cards - colored backgrounds */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link
          to="/student/resources"
          className="group p-6 rounded-2xl border border-primary/30 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all block bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(145deg, #0D5C58, #1A938F)' }}>
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">My Resources</h3>
          <p className="text-sm text-slate-600">Access your Topics &amp; OSPEs study materials.</p>
        </Link>

        <Link
          to="/student/profile"
          className="group p-6 rounded-2xl border border-primary/20 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-0.5 transition-all block hover:bg-white"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(145deg, #1A938F, #26D0CE)' }}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Study Progress</h3>
          <p className="text-sm text-slate-600">View your detailed performance analytics.</p>
        </Link>

        <Link
          to="/packages"
          className="group p-6 rounded-2xl border border-amber-200 shadow-md bg-amber-50/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-0.5 transition-all block hover:bg-amber-50"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-5 group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-slate-900">Packages</h3>
            {hasPackages && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {hasPackages ? `${packageName} • Manage your subscription.` : 'Apply for a package to unlock content.'}
          </p>
        </Link>

        <Link
          to="/proff"
          className="group p-6 rounded-2xl border border-rose-200 shadow-md bg-rose-50/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-0.5 transition-all block hover:bg-rose-50"
        >
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-5 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Upcoming Proffs</h3>
          <p className="text-sm text-slate-600">Practice with past papers and MCQs.</p>
        </Link>
      </section>

      {/* Continue Learning */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Continue Learning</h2>
          <Link to="/student/resources" className="text-primary font-semibold text-sm hover:underline">
            View All Modules
          </Link>
        </div>
        <Link
          to={continueLearning.url}
          className="block rounded-2xl border-2 border-primary/30 shadow-md p-2 hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/3 p-4">
              <img
                alt=""
                className="w-full h-48 lg:h-64 object-cover rounded-xl shadow-lg"
                src={continueLearning.imageUrl}
              />
            </div>
            <div className="flex-1 p-6 lg:pl-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                  {continueLearning.subject}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{continueLearning.title}</h3>
              <p className="text-slate-500 mb-6 max-w-2xl">{continueLearning.description}</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <span className="inline-flex items-center gap-2 w-full sm:w-auto px-10 py-4 text-white font-bold rounded-xl shadow-lg transition-all justify-center" style={{ background: 'linear-gradient(145deg, #1A938F, #26D0CE)' }}>
                  <PlayCircle className="w-5 h-5" />
                  {recentView ? 'Resume Learning' : 'Open Resources'}
                </span>
                {recentView && (
                  <span className="text-sm text-slate-500 font-medium">Continue from your last opened resource</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Info banner */}
      <div className="mt-8 p-5 rounded-xl flex items-center gap-3 border border-primary/30 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(38, 208, 206, 0.15) 0%, rgba(26, 147, 143, 0.2) 100%)' }}>
        <Info className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-slate-800">
          {hasPackages ? (
            <>You have access to {user.packages.length} package(s). Open <Link to="/student/resources" className="font-bold underline">Resources</Link> to start learning.</>
          ) : user?.freeTrialUsed ? (
            <>You used your free trial. <Link to="/packages" className="font-bold underline">Purchase a package</Link> for full access.</>
          ) : (
            <>Try one topic for free or <Link to="/packages" className="font-bold underline">apply for a package</Link> to unlock all medical modules.</>
          )}
        </p>
      </div>
    </div>
  );
}
