function WhyChoose() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "High-Yield Quizzes",
      description: "Subject-wise and module-wise quizzes designed for targeted practice and better retention."
    },
    {
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
        title: "EaseGPT",
        description: "AI-powered assistant to help solve MCQs, OSPEs, Viva preparation with intelligent checking and personalized feedback.",
        comingSoon: true
      },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "OSPE Preparation",
      description: "Unobserved OSPE practice with real exam feel to build confidence and clinical skills."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: "One Shot Videos",
      description: "One-shot videos covering the whole subject in one go for quick revision before exams."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Comprehensive Resources",
      description: "Full coverage with books, slides, past papers, and PDFs — everything in one place."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: "Recorded Lectures",
      description: "Never miss a class! Rewatch recorded sessions anytime until exam day."
    },
   
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e0f7f4 0%, #f0fdfa 40%, #f8fafc 100%)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header + Doctor illustration */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 mb-12 sm:mb-16">
          <div className="text-center lg:text-left flex-1">
            <div className="inline-block mb-4">
              <span className="text-primary font-body text-sm sm:text-base px-5 py-2 rounded-full bg-primary/10 border border-primary/20">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mb-6">
              Why Choose <span className="text-primary">MedEase?</span>
            </h2>
            <p className="text-gray-600 font-body text-base sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Built by Medical Toppers. Tailored for Your Success. Experience the difference with Pakistan's most advanced medical learning platform.
            </p>
            {/* Key Highlights - below the text */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mt-6">
              <div className="flex items-center gap-2 bg-primary/5 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-full border border-primary/20">
                <span className="text-xl sm:text-2xl">💡</span>
                <span className="text-gray-700 font-body text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Less stress. More success.</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-full border border-primary/20">
                <span className="text-xl sm:text-2xl">📈</span>
                <span className="text-gray-700 font-body text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Smarter prep. Stronger results.</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-full border border-primary/20">
                <span className="text-xl sm:text-2xl">💪</span>
                <span className="text-gray-700 font-body text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">We've got your back!</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
            <img src="/doctor.png" alt="Medical professionals collaborating" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Coming Soon Banner */}
              {feature.comingSoon && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-3">
                  COMING SOON
                </div>
              )}
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-xl ${feature.comingSoon ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-primary to-primary/80'} text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-heading font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 font-body text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
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
      </div>
    </section>
  )
}

export default WhyChoose

