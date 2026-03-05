import { Link } from 'react-router-dom';

function CommunityFollow() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-br from-primary/5 via-white to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 sm:p-8 md:p-10 text-white text-center shadow-2xl">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3 sm:mb-4">
              Stay Tuned and Follow MedEase!
            </h3>
            <p className="text-white/90 font-body text-base sm:text-lg md:text-xl mb-5 sm:mb-6 max-w-xl mx-auto leading-relaxed">
              Quizzes, OSPEs, Exam prep & a lot more coming your way!
            </p>
            <Link to="/contact" className="bg-white text-primary font-heading font-bold px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base md:text-lg inline-flex items-center gap-2 shadow-xl">
              Join Our Community
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommunityFollow

