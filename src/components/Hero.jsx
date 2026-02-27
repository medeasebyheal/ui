function Hero() {
  const doctorImages = [
    '/dr1.webp',
    '/dr2.jpg',
    '/dr3.avif',
    '/dr1.webp',
    '/dr2.jpg',
    '/dr3.avif',
    '/dr1.webp',
    '/dr2.jpg',
    '/dr3.avif',
    
  ];

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Trust Badge */}
        <div className="inline-block relative z-10">
          <span className="text-primary font-body text-sm sm:text-base px-5 py-2.5 rounded-full bg-white border-2 border-primary/20 shadow-sm inline-flex items-center gap-2">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Trusted by Medical Students
          </span>
        </div>
          
        {/* Gradient Glow Background */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[300px] sm:w-[800px] sm:h-[500px] md:w-[1000px] md:h-[600px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 rounded-full blur-[80px] sm:blur-[120px] md:blur-[150px]"></div>
        </div>

        {/* Stethoscope branding (stato) - animated up/down */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 md:w-80 h-auto max-h-[70vh] opacity-20 pointer-events-none select-none hidden sm:block" aria-hidden>
          <div className="animate-stato-float w-full h-full inline-block">
            <img src="/stato.png" alt="" className="w-full h-full object-contain object-right block" />
          </div>
        </div>
        <div className="absolute left-0 bottom-0 w-40 sm:w-52 md:w-64 h-auto max-h-[50vh] opacity-15 pointer-events-none select-none sm:hidden" aria-hidden>
          <div className="animate-stato-float w-full h-full inline-block">
            <img src="/stato.png" alt="" className="w-full h-full object-contain object-left block" />
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight relative z-10">
          <span className="text-gray-900">
            Struggling to keep up with your{" "}
          </span>
          <span className="text-primary">
            Med School Grind?
          </span>
        </h1>
        
        {/* Sub Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-semibold leading-tight relative z-10">
          <span className="text-gray-800">
            Say goodbye to stress and hello to{" "}
          </span>
          <br/>
          <span className="text-primary">
            MedEase
          </span>
        
          <span className="text-gray-800">
            {" "}— your ultimate exam partner!
          </span>
        </h2>
        
        {/* CTA Buttons */}
        <div className="flex flex-row flex-wrap justify-center gap-3 sm:gap-6 pt-4 relative z-10">
          <button className="flex-1 min-w-0 sm:flex-initial sm:min-w-0 bg-gradient-to-r from-primary to-primary/90 text-white font-heading font-semibold px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-lg inline-flex items-center justify-center gap-1.5 sm:gap-2">
            Start Your Journey 
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button className="flex-1 min-w-0 sm:flex-initial sm:min-w-0 bg-white text-gray-800 border-2 border-gray-300 font-heading font-semibold px-4 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-lg inline-flex items-center justify-center gap-1.5 sm:gap-2">
            Explore Features 
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
        
        {/* User Avatars Section with Wave Animation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-8 relative z-10">
          <div className="flex -space-x-3">
            {doctorImages.map((image, i) => (
              <div 
                key={i}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 border-white shadow-md overflow-hidden transition-transform duration-300 hover:scale-110 hover:z-10 animate-wave"
                style={{
                  animationDelay: `${i * 0.1}s`
                }}
              >
                <img 
                  src={image} 
                  alt={`Doctor ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="text-gray-600 font-body text-sm sm:text-base text-center sm:text-left">
            <span className="font-semibold text-gray-900">10,000+</span> students trust us
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

