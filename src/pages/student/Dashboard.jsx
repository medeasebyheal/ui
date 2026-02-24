import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, BarChart3, CreditCard, Calendar, PlayCircle, Info } from 'lucide-react';
import { getRecentViews } from '../../utils/recentViews';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=400&fit=crop';

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
      {/* Welcome card */}
      <section className="mb-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {displayName}! 👋</h1>
            <p className="text-slate-500 text-lg">Access your modules and continue learning.</p>
          </div>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl" />
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link
          to="/student/resources"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all block"
        >
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-primary mb-5 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">My Resources</h3>
          <p className="text-sm text-slate-500">Access your Topics &amp; OSPEs study materials.</p>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Study Progress</h3>
          <p className="text-sm text-slate-500">View your detailed performance analytics.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-5">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-slate-900">Packages</h3>
            {hasPackages && (
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {hasPackages ? `${packageName} • Manage your subscription.` : 'Apply for a package to unlock content.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-5">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Upcoming Proffs</h3>
          <p className="text-sm text-slate-500">Practice with past papers and MCQs.</p>
        </div>
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
          className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-2 hover:shadow-md transition-shadow"
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
                <span className="inline-flex items-center gap-2 w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-teal-700 transition-all justify-center">
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
      <div className="mt-8 p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-3">
        <Info className="w-5 h-5 text-primary" />
        <p className="text-sm text-teal-800">
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
