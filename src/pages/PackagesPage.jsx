import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlanCard, PLAN_DATA } from '../components/Plan';
import AuthModal from '../components/AuthModal';

export default function PackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const plans = user ? PLAN_DATA.filter((p) => p.planKey !== 'free-trial') : PLAN_DATA;
  const isThreePlans = plans.length === 3;
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalPlanKey, setAuthModalPlanKey] = useState(null);

  const handleBuyNow = (plan) => {
    if (plan.planKey === 'free-trial') {
      navigate('/register');
      return;
    }
    if (user) {
      navigate(`/checkout?plan=${plan.planKey}`);
    } else {
      setAuthModalPlanKey(plan.planKey);
      setAuthModalOpen(true);
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-primary/5 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - same as home Plan */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-block mb-3 sm:mb-4">
            <span className="text-primary font-body text-xs sm:text-sm md:text-base px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white border-2 border-primary/20 shadow-sm">
              Pricing Plans
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-4">
            Choose Your <span className="text-primary">Success Plan</span>
          </h2>
          <p className="text-gray-600 font-body text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Flexible plans designed for every medical student's journey. Start with a free trial or go premium for complete access.
          </p>
        </div>

        {/* Desktop Grid - center when only 3 plans (logged-in) */}
        <div className={`hidden xl:grid gap-6 xl:gap-8 pt-4 ${isThreePlans ? 'xl:grid-cols-3 max-w-6xl mx-auto' : 'xl:grid-cols-4'}`}>
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} onBuyNow={handleBuyNow} />
          ))}
        </div>

        {/* Tablet Horizontal Scroll - same as home Plan */}
        <div className="hidden md:block xl:hidden relative pt-6">
          <div className="overflow-x-auto">
            <div className={`flex gap-6 pb-6 px-4 pt-6 ${isThreePlans ? 'justify-center' : ''}`}>
              {plans.map((plan, index) => (
                <div key={index} className="flex-shrink-0 w-[340px] lg:w-[380px]">
                  <PlanCard plan={plan} onBuyNow={handleBuyNow} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {plans.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/30 transition-all" />
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4 font-body">
            ← Scroll to see all plans →
          </p>
        </div>

        {/* Mobile Carousel - same as home Plan */}
        <div className="md:hidden relative px-2 pt-6">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 -mx-2 px-2">
            {plans.map((plan, index) => (
              <div key={index} className="snap-center flex-shrink-0 w-[90vw] max-w-[380px] pt-4">
                <PlanCard plan={plan} onBuyNow={handleBuyNow} />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {plans.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/30 transition-all" />
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4 font-body">
            ← Swipe to see more plans →
          </p>
        </div>

        {/* Bottom CTA - same as home Plan */}
        <div className="mt-8 sm:mt-12 md:mt-16 text-center px-4">
          <p className="text-gray-600 font-body text-xs sm:text-sm md:text-base mb-2 sm:mb-4">
            🎓 All plans include access to our growing library of resources • Cancel anytime
          </p>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} planKey={authModalPlanKey} />
    </section>
  );
}
