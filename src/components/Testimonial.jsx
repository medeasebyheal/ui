function Testimonial() {
  const testimonials = [
    { image: "/testimonial.jpg" },
    { image: "/testimonial 2.jpg" },
    { image: "/testi3.jpg" },
    { image: "/testi4.jpg" },
    { image: "/testi5.jpg" },
    { image: "/testi6.jpg" },
    { image: "/testi7.jpg" },
    { image: "/testi8.jpg" },
    { image: "/testi9.jpg" },
    { image: "/testi10.jpg" },
    { image: "/testi11.jpg" },
    { image: "/testi12.jpg" }
  ];

  // Triple the testimonials for seamless infinite loop
  const allTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 bg-gradient-to-br from-primary/5 via-white to-primary/5 overflow-hidden">
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 md:mb-16">
        <div className="text-center">
          <div className="inline-block mb-3 sm:mb-4">
            <span className="text-primary font-body text-xs sm:text-sm md:text-base px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white border-2 border-primary/20 shadow-sm">
              Student Success Stories
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-4">
            What Our <span className="text-primary">Students Say</span>
          </h2>
          
          <p className="text-gray-600 font-body text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Join thousands of successful medical students who transformed their academic journey with MedEase.
          </p>
        </div>
      </div>

      {/* Continuous Sliding Testimonials - Full Width */}
      <div className="relative mb-8 sm:mb-12">
        <div className="overflow-hidden w-full">
          {/* Sliding Container with hover pause - No padding/margin */}
          <div className="flex gap-4 sm:gap-6 animate-scroll">
            {allTestimonials.map((testimonial, index) => (
              <TestimonialCard key={`testimonial-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
        
        {/* Fade edges for better visual */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
      </div>

      {/* Bottom Stats */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="text-center p-4 bg-white rounded-xl border-2 border-primary/10">
            <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1">10,000+</p>
            <p className="text-xs sm:text-sm text-gray-600 font-body">Active Students</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl border-2 border-primary/10">
            <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1">95%</p>
            <p className="text-xs sm:text-sm text-gray-600 font-body">Success Rate</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl border-2 border-primary/10">
            <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1">500+</p>
            <p className="text-xs sm:text-sm text-gray-600 font-body">5-Star Reviews</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl border-2 border-primary/10">
            <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary mb-1">24/7</p>
            <p className="text-xs sm:text-sm text-gray-600 font-body">Support</p>
          </div>
        </div>
      </div>
      <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 sm:p-10 border-2 border-primary/20">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-4">
              Ready to Transform Your Med School Journey?
            </h3>
            <p className="text-gray-600 font-body text-base sm:text-lg mb-6 max-w-2xl mx-auto">
              From last-minute revisions to targeted practice, we've got your back through every step of exam season. 💪📚
            </p>
            <button className="bg-gradient-to-r from-primary to-primary/90 text-white font-heading font-semibold px-8 sm:px-10 py-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-base sm:text-lg inline-flex items-center justify-center gap-2">
              Get Started Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
    </section>
    
  )
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="flex-shrink-0 w-64 sm:w-80 md:w-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
      {/* Testimonial Image - Full Size */}
      <img 
        src={testimonial.image} 
        alt="Student testimonial"
        className="w-full h-auto object-contain"
      />
    </div>
  )
}

export default Testimonial

