import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export const PLAN_DATA = [
    {
      planKey: 'free-trial',
      name: "Free Trial",
      price: "0",
      originalPrice: null,
      promoPrice: null,
      duration: "7 Days",
      description: "Try before you commit",
      badge: "STARTER",
      features: [
        { name: "High-Yield MCQ Quizzes", available: true },
        { name: "Limited OSPE Practice", available: true },
        { name: "Community Support", available: true },
        { name: "One Shot Videos", available: false },
        { name: "Recorded Lectures", available: false },
        { name: "Books, Slides & Past Papers", available: false },
      ],
      highlighted: false
    },
    {
      planKey: 'half-year',
      name: "Half Year",
      price: "2250",
      originalPrice: "3000",
      duration: "6 Months",
      description: "Part 1 or Part 2 per year",
      badge: "POPULAR",
      features: [
        { name: "Full MCQ Database", available: true },
        { name: "Complete OSPE Practice", available: true },
        { name: "One Shot Videos", available: true },
        { name: "Recorded Lectures", available: true },
        { name: "Books, Slides & Past Papers", available: true },
        { name: "MS 1–3 Part 1 & 2 modules", available: true },
        { name: "EaseGPT", available: true },
      ],
      highlighted: true
    },
    {
      planKey: 'full-year',
      name: "Full Year",
      price: "3750",
      originalPrice: "4000",
      duration: "12 Months",
      description: "Complete year coverage",
      badge: "BEST VALUE",
      features: [
        { name: "Full MCQ Database", available: true },
        { name: "Complete OSPE Practice", available: true },
        { name: "One Shot Videos", available: true },
        { name: "Recorded Lectures", available: true },
        { name: "Books, Slides & Past Papers", available: true },
        { name: "All MS 1, 2 & 3 modules", available: true },
        { name: "Priority Support", available: true },
        { name: "EaseGPT", available: true },
      ],
      highlighted: false
    },
    {
      planKey: 'master-proff',
      name: "Proff Buster",
      price: "—",
      originalPrice: null,
      promoPrice: null,
      duration: "MS 1",
      description: "Papers 1–4",
      badge: "PREMIUM",
      features: [
        { name: "Paper 1, 2, 3 & 4", available: true },
        { name: "Full MCQ Database", available: true },
        { name: "Complete OSPE Practice", available: true },
        { name: "Unlimited One Shot Videos", available: true },
        { name: "All Recorded Lectures", available: true },
        { name: "Premium Resources", available: true },
        { name: "24/7 Priority Support", available: true },
        { name: "EaseGPT Full Access", available: true },
      ],
      highlighted: false
    }
  ];

function Plan() {
  const plans = PLAN_DATA;
  const { user } = useAuth();
  const navigate = useNavigate();
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
        {/* Section Header */}
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

        {/* Desktop Grid - 4 columns on xl+ screens */}
        <div className="hidden xl:grid xl:grid-cols-4 gap-6 xl:gap-8 pt-4">
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} onBuyNow={handleBuyNow} />
          ))}
        </div>

        {/* Tablet/iPad Horizontal Scroll - Visible on md to xl screens */}
        <div className="hidden md:block xl:hidden relative pt-6">
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-6 px-4 pt-6">
              {plans.map((plan, index) => (
                <div key={index} className="flex-shrink-0 w-[340px] lg:w-[380px]">
                  <PlanCard plan={plan} onBuyNow={handleBuyNow} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {plans.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/30 transition-all"></div>
            ))}
          </div>
          
          {/* Scroll Hint */}
          <p className="text-center text-xs text-gray-500 mt-4 font-body">
            ← Scroll to see all plans →
          </p>
        </div>

        {/* Mobile Carousel - Visible only on small screens */}
        <div className="md:hidden relative px-2 pt-6">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 -mx-2 px-2">
            {plans.map((plan, index) => (
              <div key={index} className="snap-center flex-shrink-0 w-[90vw] max-w-[380px] pt-4">
                <PlanCard plan={plan} onBuyNow={handleBuyNow} />
              </div>
            ))}
          </div>
          
          {/* Scroll Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {plans.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/30 transition-all"></div>
            ))}
          </div>
          
          {/* Swipe Hint */}
          <p className="text-center text-xs text-gray-500 mt-4 font-body">
            ← Swipe to see more plans →
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 sm:mt-12 md:mt-16 text-center px-4">
          <p className="text-gray-600 font-body text-xs sm:text-sm md:text-base mb-2 sm:mb-4">
            🎓 All plans include access to our growing library of resources • Cancel anytime
          </p>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} planKey={authModalPlanKey} />
    </section>
  )
}

export function PlanCard({ plan, ctaText, ctaTo, isLink = false, onBuyNow }) {
  const displayPrice = plan.price;
  return (
    <div className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 h-full flex flex-col ${
      plan.highlighted 
        ? 'bg-gradient-to-br from-primary to-primary/90 text-white shadow-2xl scale-105 border-4 border-primary' 
        : 'bg-white border-2 border-gray-200 hover:border-primary/50 hover:shadow-xl'
    }`}>
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-3 right-6 px-4 py-1 rounded-full text-xs font-bold shadow-lg ${
          plan.highlighted 
            ? 'bg-white text-primary' 
            : 'bg-gradient-to-r from-primary to-primary/80 text-white'
        }`}>
          {plan.badge}
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className={`text-2xl sm:text-3xl font-heading font-bold mb-2 ${
          plan.highlighted ? 'text-white' : 'text-gray-900'
        }`}>
          {plan.name}
        </h3>
        <p className={`text-sm ${plan.highlighted ? 'text-white/90' : 'text-gray-600'}`}>
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {plan.originalPrice && (
          <p className={`text-sm mb-0.5 line-through ${plan.highlighted ? 'text-white/70' : 'text-gray-400'}`}>
            ₨{plan.originalPrice}
          </p>
        )}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-4xl sm:text-5xl font-heading font-bold ${
            plan.highlighted ? 'text-white' : 'text-gray-900'
          }`}>
            {displayPrice === "0" ? "Free" : ["—", "Contact", "TBD"].includes(displayPrice) ? displayPrice : `₨${displayPrice}`}
          </span>
          {displayPrice !== "0" && !["—", "Contact", "TBD"].includes(displayPrice) && (
            <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
              /{plan.duration}
            </span>
          )}
        </div>
        {(plan.price === "0" || displayPrice === "—") && plan.duration && (
          <p className={`text-sm mt-1 ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
            {plan.duration}
          </p>
        )}
      </div>

      {/* CTA Button */}
      {onBuyNow ? (
        <button
          type="button"
          onClick={() => onBuyNow(plan)}
          className={`w-full py-3 rounded-lg font-heading font-semibold text-base mb-6 transition-all duration-300 transform hover:scale-105 ${
            plan.highlighted
              ? 'bg-white text-primary hover:bg-gray-50 shadow-lg'
              : 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg'
          }`}
        >
          {plan.price === "0" ? "Start Free Trial" : "Buy Now"}
        </button>
      ) : isLink && ctaTo ? (
        <Link
          to={ctaTo}
          className={`block w-full py-3 rounded-lg font-heading font-semibold text-base mb-6 transition-all duration-300 transform hover:scale-105 text-center ${
            plan.highlighted
              ? 'bg-white text-primary hover:bg-gray-50 shadow-lg'
              : 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg'
          }`}
        >
          {ctaText || (plan.price === "0" ? "Start Free Trial" : "Buy Now")}
        </Link>
      ) : (
        <button className={`w-full py-3 rounded-lg font-heading font-semibold text-base mb-6 transition-all duration-300 transform hover:scale-105 ${
          plan.highlighted 
            ? 'bg-white text-primary hover:bg-gray-50 shadow-lg' 
            : 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg'
        }`}>
          {plan.price === "0" ? "Start Free Trial" : "Buy Now"}
        </button>
      )}

      {/* Features List */}
      <div className="flex-grow">
        <p className={`text-sm font-semibold mb-4 ${
          plan.highlighted ? 'text-white/90' : 'text-gray-700'
        }`}>
          What's included:
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                feature.available 
                  ? plan.highlighted ? 'bg-white/20' : 'bg-primary/10'
                  : 'bg-gray-100'
              }`}>
                {feature.available ? (
                  <Check className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${
                feature.available 
                  ? plan.highlighted ? 'text-white' : 'text-gray-700'
                  : 'text-gray-400 line-through'
              }`}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Plan

