import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  GraduationCap,
  Lock,
  FileText,
  ChevronRight,
  Dna,
  Building2,
  Bone,
  Circle,
  LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function ProffPage() {
  const { user } = useAuth();
  const [proffStructures, setProffStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [universityFilter, setUniversityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api
      .get('/content/proff')
      .then(({ data }) => setProffStructures(data))
      .catch(() => setProffStructures([]))
      .finally(() => setLoading(false));
  }, []);

  const hasProffAccess = useMemo(() => {
    return user?.packages?.some((up) => up.package?.type === 'master_proff') ?? false;
  }, [user?.packages]);

  const jsmu = proffStructures.find((ps) => ps.university === 'jsmu');
  const other = proffStructures.find((ps) => ps.university === 'other');
  const jsmuYears = useMemo(() => jsmu?.years ?? [], [jsmu]);
  const otherYears = useMemo(() => other?.years ?? [], [other]);

  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text?.toLowerCase().includes(searchQuery.trim().toLowerCase());
  };
  const showJsmu = universityFilter === 'all' || universityFilter === 'jsmu';
  const showOther = universityFilter === 'all' || universityFilter === 'other';
  const filteredJsmuYears = useMemo(() => {
    return jsmuYears.filter(
      (yr) =>
        matchesSearch(yr.name) ||
        (yr.papers || []).some((p) => matchesSearch(p.name))
    );
  }, [jsmuYears, searchQuery]);
  const filteredOtherYears = useMemo(() => {
    return otherYears.filter(
      (yr) =>
        matchesSearch(yr.name) ||
        (yr.subjects || []).some((s) => matchesSearch(s.name))
    );
  }, [otherYears, searchQuery]);

  // Year 1 = free preview; Year 2+ = requires Master Proff package
  const isYearAccessible = (yearIndex) => {
    if (hasProffAccess) return true;
    return yearIndex === 0;
  };

  return (
    <div className="min-h-screen bg-background-light text-slate-800 font-display">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Proff Preparation
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            JSMU and other university formats. Purchase{' '}
            <span className="text-primary font-semibold">Master Proff Package</span>{' '}
            for full access to premium resources.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setUniversityFilter('all')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                universityFilter === 'all'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Universities
            </button>
            <button
              type="button"
              onClick={() => setUniversityFilter('jsmu')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                universityFilter === 'jsmu'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              JSMU
            </button>
            <button
              type="button"
              onClick={() => setUniversityFilter('other')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                universityFilter === 'other'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Other
            </button>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exams or years..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-12">Loading...</p>
        ) : (
          <>
            {/* JSMU Section */}
            {showJsmu && jsmu && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">JSMU</h2>
                    <p className="text-sm text-slate-500">
                      Resource categorized by Year-wise modules
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredJsmuYears.length === 0 ? (
                    <p className="text-slate-500 col-span-full">
                      No JSMU years match your search.
                    </p>
                  ) : (
                    filteredJsmuYears.map((yr, yi) => {
                      const yearIndex = jsmuYears.findIndex((y) => y._id === yr._id);
                      const accessible = isYearAccessible(yearIndex);
                      const papers = yr.papers || [];
                      const mcqPapers = papers.filter((p) => p.type === 'mcq');
                      const ospePapers = papers.filter((p) => p.type === 'ospe');

                      return (
                        <div
                          key={yr._id}
                          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <h3
                              className={`text-xl font-bold ${
                                accessible ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {yr.name || `Year ${yearIndex + 1}`}
                            </h3>
                            {accessible ? (
                              <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                Active
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                <Lock className="w-3.5 h-3.5" />
                                Locked
                              </div>
                            )}
                          </div>
                          <div
                            className={`space-y-4 ${!accessible ? 'opacity-50 grayscale' : ''}`}
                          >
                            {mcqPapers.map((p) => {
                              const Wrapper = accessible ? Link : 'div';
                              return (
                              <Wrapper
                                key={p._id}
                                {...(accessible ? { to: '#' } : {})}
                                className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all ${
                                  accessible ? 'hover:bg-primary/5' : 'cursor-default'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <FileText
                                      className={`w-5 h-5 ${
                                        accessible ? 'text-primary' : 'text-slate-400'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <p
                                      className={`font-semibold ${
                                        accessible
                                          ? 'text-slate-800'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {p.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {p.type === 'ospe' ? 'OSPE' : 'Mix MCQs'}
                                    </p>
                                  </div>
                                </div>
                                {accessible && (
                                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-all flex-shrink-0" />
                                )}
                              </Wrapper>
                              );
                            })}
                            {ospePapers.length > 0 && (
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                {ospePapers.map((p) => {
                                  const OspWrapper = accessible ? Link : 'div';
                                  return (
                                  <OspWrapper
                                    key={p._id}
                                    {...(accessible ? { to: '#' } : {})}
                                    className={`flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl transition-all group ${
                                      accessible ? 'hover:bg-primary/5' : 'cursor-default'
                                    }`}
                                  >
                                    <Dna
                                      className={`w-6 h-6 ${
                                        accessible ? 'text-primary' : 'text-slate-400'
                                      }`}
                                    />
                                    <span
                                      className={`font-semibold text-sm ${
                                        accessible
                                          ? 'text-slate-800'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {p.name}
                                    </span>
                                  </OspWrapper>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {!accessible && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center flex-col p-6 text-center">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                                <Lock className="w-8 h-8 text-primary" />
                              </div>
                              <p className="font-bold text-slate-900 mb-1">
                                Premium Content
                              </p>
                              <p className="text-sm text-slate-600 mb-6 px-4">
                                Register and purchase a package to unlock all{' '}
                                {yr.name || `Year ${yearIndex + 1}`} resources.
                              </p>
                              <Link
                                to="/packages"
                                className="bg-primary hover:bg-teal-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all"
                              >
                                Upgrade Now
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Other University Section */}
            {showOther && other && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      OTHER UNIVERSITY
                    </h2>
                    <p className="text-sm text-slate-500">
                      General medical curriculum resources
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                  {filteredOtherYears.length === 0 ? (
                    <p className="text-slate-500">No other university years configured yet.</p>
                  ) : (
                    <div className="max-w-3xl">
                      {filteredOtherYears.map((yr, yi) => {
                        const yearIndex = otherYears.findIndex((y) => y._id === yr._id);
                        const yearAccessible = isYearAccessible(yearIndex);
                        const subjects = yr.subjects || [];
                        // Year 1 first subject = free preview; rest need Master Proff
                        const accessibleSubjects = yearAccessible
                          ? subjects
                          : yearIndex === 0
                            ? subjects.slice(0, 1)
                            : [];
                        const lockedSubjects = yearAccessible
                          ? []
                          : yearIndex === 0
                            ? subjects.slice(1)
                            : subjects;

                        return (
                          <div key={yr._id} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-2xl">
                                {yr.name || `Year ${yearIndex + 1}`}
                              </div>
                              <div className="h-[1px] flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                              {accessibleSubjects.map((sub) => (
                                <div key={sub._id}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <Bone className="w-5 h-5 text-primary flex-shrink-0" />
                                    <h4 className="text-lg font-bold text-slate-900">
                                      {sub.name || 'Subject'}
                                    </h4>
                                  </div>
                                  <ul className="space-y-3">
                                    <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group">
                                      <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 fill-current" />
                                      <span className="text-slate-600 font-medium group-hover:text-slate-900">
                                        Subject-wise Mix MCQs
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group">
                                      <Circle className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 fill-current" />
                                      <span className="text-slate-600 font-medium group-hover:text-slate-900">
                                        Subject-wise OSPE
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              ))}
                              {lockedSubjects.length > 0 && (
                                <div
                                  className={`relative overflow-hidden p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center ${
                                    accessibleSubjects.length === 0 ? 'md:col-span-2' : ''
                                  }`}
                                >
                                  <LockKeyhole className="w-10 h-10 text-slate-300 mb-2" />
                                  <p className="text-sm font-semibold text-slate-500">
                                    {lockedSubjects.length === 1
                                      ? `Unlock ${lockedSubjects[0].name}`
                                      : `Unlock ${lockedSubjects.map((s) => s.name).join(' & ')}`}
                                  </p>
                                  <Link
                                    to="/packages"
                                    className="mt-4 text-xs font-bold text-primary hover:underline"
                                  >
                                    View Pricing Plans
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {!loading &&
              proffStructures.length === 0 &&
              (showJsmu || showOther) && (
                <p className="text-center text-slate-500 py-12">
                  Proff structure not configured yet.
                </p>
              )}

            {/* CTA Footer */}
            <footer className="mt-16">
              <div className="bg-gradient-to-r from-teal-600 to-primary rounded-[2.5rem] p-8 md:p-12 text-center text-white shadow-2xl shadow-teal-500/20">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to ace your Proff exams?
                </h2>
                <p className="text-teal-50 opacity-90 mb-8 max-w-xl mx-auto">
                  Get access to high-yield questions, OSPE patterns, and exclusive
                  university-specific modules today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/packages"
                    className="bg-white text-primary px-10 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 inline-block"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    to="/contact"
                    className="bg-teal-700/30 backdrop-blur-sm border border-white/20 px-10 py-4 rounded-2xl font-bold hover:bg-teal-700/50 transition-all inline-block"
                  >
                    Schedule a Demo
                  </Link>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm">
                  © 2024 MedEase - Empowering the next generation of doctors.
                </p>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
