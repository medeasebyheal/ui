import React from 'react';

export default function Terms() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-8 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold">Terms of Service</h1>
            <p className="mt-2 text-sm opacity-90">Effective Date: February 2026</p>
          </div>
        </header>

        <main className="bg-white rounded-2xl p-8 shadow-sm text-gray-700">
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">By enrolling in MedEase MBBS or BDS courses, you agree to comply with these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2 className="text-xl font-semibold mb-2">2. Services Provided</h2>
          <p className="text-gray-700 mb-4">MedEase provides video lectures, notes and educational materials, practice MCQs and tests, academic performance tracking and online tutoring support. MedEase is an educational support platform and not a degree-granting institution.</p>

          <h2 className="text-xl font-semibold mb-2">3. Account Registration</h2>
          <p className="text-gray-700 mb-4">Students must provide accurate information, maintain confidentiality of login credentials and are responsible for activity under their account. Account sharing is strictly prohibited and may result in suspension or termination without refund.</p>

          <h2 className="text-xl font-semibold mb-2">4. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">All MedEase content is our intellectual property. Students may NOT share, record, redistribute or upload content elsewhere. Violation may result in legal action.</p>

          <h2 className="text-xl font-semibold mb-2">5. Course Access</h2>
          <p className="text-gray-700 mb-4">Course access is granted for the duration specified in the purchased package. Access may be time-limited, non-transferable and revocable if terms are violated.</p>

          <h2 className="text-xl font-semibold mb-2">6. Payments</h2>
          <p className="text-gray-700 mb-4">All payments must be completed before accessing paid content. Prices may change without prior notice, but enrolled students retain their purchased access.</p>

          <h2 className="text-xl font-semibold mb-2">7. Platform Availability</h2>
          <p className="text-gray-700 mb-4">We strive for uninterrupted access, but MedEase does not guarantee continuous availability or error-free operation. Maintenance or technical issues may cause temporary interruptions.</p>

          <h2 className="text-xl font-semibold mb-2">8. Termination</h2>
          <p className="text-gray-700 mb-4">MedEase reserves the right to suspend or terminate accounts for policy violations, account sharing or misuse of resources.</p>

          <h2 className="text-xl font-semibold mb-2">9. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">MedEase is not responsible for examination outcomes or academic performance. We provide educational support, not guaranteed results.</p>
        </main>
      </div>
    </section>
  );
}

