import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyPackageCTA() {
  return (
    <section className="mb-8 sm:mb-16 text-center">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 sm:p-8 border-2 border-primary/20 mx-4 sm:mx-0">
        <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3">
          Ready to Transform Your Med School Journey?
        </h3>
        <p className="text-gray-600 font-body text-sm sm:text-base mb-4 max-w-2xl mx-auto">
          From last-minute revisions to targeted practice, we've got your back through every step of exam season. 💪📚
        </p>
        <div className="flex justify-center">
          <Link
            to="/packages"
            className="bg-gradient-to-r from-primary to-primary/90 text-white font-heading font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-base sm:text-lg inline-flex items-center justify-center gap-2"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
}

