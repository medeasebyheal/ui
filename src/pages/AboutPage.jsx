import { Link } from 'react-router-dom';
import {
  Users,
  BadgeCheck,
  Star,
  Headphones,
  TrendingUp,
  CheckCheck,
  Brain,
  Smile,
} from 'lucide-react';

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfFpTaKICbpdIpnL3Fsc5ju5HPmXBvjCGNq1_UxFy6mNA-RdN-24pUcNq-usrdKEy46_qmujRh0uV5F5XQpwjL-zzbEkjsVuWne7EOPawiI6AQURGLkCahnylHX6dfn5ps8huIsTAmd1k5JrAktid8kgV5DmXzdhkfViE5W8bx_51fyERegVm6VL-TwtUVTBab8lTFSDruSt_UDKHiYxs4XyVP3bB9M4wijhx8knTugaaJB9LtJYIbpMYFdCzgKEiMuCsspe-Lbzo';

export default function AboutPage() {
  return (
    <div
      className="relative flex w-full flex-col overflow-x-hidden font-display text-slate-900 dark:text-slate-100"
      style={{ background: 'linear-gradient(135deg, #e0f7f4 0%, #f5f8f8 100%)' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Hero Section */}
        <main className="flex flex-col items-center">
          <div className="max-w-[1280px] w-full px-6 md:px-20 py-12 md:py-20">
            <div className="flex flex-col gap-10 lg:flex-row items-center">
              <div className="flex flex-col gap-8 lg:w-1/2">
                <div className="flex flex-col gap-4">
                  <span className="text-primary font-bold tracking-widest text-sm uppercase">
                    Pakistan&apos;s #1 Learning App
                  </span>
                  <h1 className="text-slate-900 dark:text-slate-100 text-4xl md:text-6xl font-heading font-bold leading-tight tracking-tight">
                    Master Medschool with Pakistan&apos;s Most Advanced Platform
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-normal leading-relaxed">
                    Say goodbye to stress and hello to MedEase. Built by medical toppers, tailored for your success.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/register"
                    className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                  >
                    Start Your Journey
                  </Link>
                  <Link
                    to="/packages"
                    className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Explore Features
                  </Link>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    alt="Two doctors discussing medical cases"
                    className="w-full h-auto object-cover aspect-[4/3]"
                    src={HERO_IMAGE}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="w-full bg-white dark:bg-slate-900/50 py-16">
            <div className="max-w-[1280px] mx-auto px-6 md:px-20">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="flex flex-col gap-2 rounded-2xl p-8 bg-background-light dark:bg-background-dark border border-primary/10 items-center text-center">
                  <Users className="text-primary w-10 h-10 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                    Active Students
                  </p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-heading font-bold">10,000+</p>
                  <p className="text-emerald-500 text-sm font-bold flex items-center gap-1 justify-center">
                    <TrendingUp className="w-4 h-4" /> +15% this month
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl p-8 bg-background-light dark:bg-background-dark border border-primary/10 items-center text-center">
                  <BadgeCheck className="text-primary w-10 h-10 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                    Success Rate
                  </p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-heading font-bold">95%</p>
                  <p className="text-emerald-500 text-sm font-bold flex items-center gap-1 justify-center">
                    <TrendingUp className="w-4 h-4" /> Top performance
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl p-8 bg-background-light dark:bg-background-dark border border-primary/10 items-center text-center">
                  <Star className="text-primary w-10 h-10 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                    5-Star Reviews
                  </p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-heading font-bold">500+</p>
                  <p className="text-emerald-500 text-sm font-bold flex items-center gap-1 justify-center">
                    <TrendingUp className="w-4 h-4" /> Verified learners
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl p-8 bg-background-light dark:bg-background-dark border border-primary/10 items-center text-center">
                  <Headphones className="text-primary w-10 h-10 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                    Expert Support
                  </p>
                  <p className="text-slate-900 dark:text-slate-100 text-3xl font-heading font-bold">24/7</p>
                  <p className="text-emerald-500 text-sm font-bold flex items-center gap-1 justify-center">
                    <CheckCheck className="w-4 h-4" /> Instant response
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition Section */}
          <div className="max-w-[1280px] w-full px-6 md:px-20 py-20">
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-4 text-center items-center">
                <h2 className="text-slate-900 dark:text-slate-100 text-4xl md:text-5xl font-heading font-bold tracking-tight">
                  Why Choose MedEase?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-[700px]">
                  Smarter prep, stronger results. Less stress, more success. Our platform is engineered to help
                  Pakistani medical students excel.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-5 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-8 hover:shadow-xl transition-all border-b-4 border-b-primary">
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center text-primary">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-xl font-heading font-semibold">Smarter Prep</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Our platform adapts to your learning style, ensuring you cover high-yield topics efficiently and
                      retain information longer.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-8 hover:shadow-xl transition-all border-b-4 border-b-primary">
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-xl font-heading font-semibold">Stronger Results</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Join thousands of students who have cleared their UHS, NUMS, and KMU exams with flying colors
                      using our verified resources.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-8 hover:shadow-xl transition-all border-b-4 border-b-primary">
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center text-primary">
                    <Smile className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-xl font-heading font-semibold">Less Stress</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Study with confidence knowing you have the best tools built by medical toppers and consultants at
                      your fingertips.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="max-w-[1280px] w-full px-6 md:px-20 pb-24">
            <div className="bg-primary rounded-[2rem] p-10 md:p-20 text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-8">
                <h2 className="text-white text-3xl md:text-5xl font-heading font-bold leading-tight max-w-[800px]">
                  Ready to excel in your medical career?
                </h2>
                <p className="text-white/90 text-lg md:text-xl max-w-[600px]">
                  Join the largest community of medical students in Pakistan today and start your journey to becoming a
                  top doctor.
                </p>
                <div className="flex justify-center w-full">
                  <Link
                    to="/register"
                    className="flex min-w-[220px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white text-primary text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
