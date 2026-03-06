import React from 'react';

export default function PrivacyPolicy() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-8 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold">Privacy Policy</h1>
            <p className="mt-2 text-sm opacity-90">Effective Date: February 2026</p>
          </div>
        </header>

        <main className="bg-white rounded-2xl p-8 shadow-sm text-gray-700">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            MedEase ("we", "our", "us") is committed to protecting the privacy and personal information of medical and dental students using our platform. This Privacy Policy explains how we collect, use, store, and protect your information when you access MedEase courses, including MBBS and BDS modules. By using MedEase, you agree to the practices described in this Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-gray-700 mb-2"><strong>a. Personal Information</strong></p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Educational institution</li>
            <li>Academic year (MBBS/BDS year)</li>
            <li>Payment information (processed securely via third-party providers)</li>
          </ul>

          <p className="text-gray-700 mb-2"><strong>b. Account Information</strong></p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Username and password</li>
            <li>Course enrollments</li>
            <li>Progress, test scores, and performance analytics</li>
          </ul>

          <p className="text-gray-700 mb-2"><strong>c. Technical Information</strong></p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>IP address</li>
            <li>Device type</li>
            <li>Browser type</li>
            <li>Login timestamps</li>
            <li>Usage patterns on the platform</li>
          </ul>

          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use your information to provide access to courses, track academic progress, process payments, improve course content, communicate updates, provide support, and prevent fraud. We do NOT sell your personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold mb-2">4. Data Protection and Security</h2>
          <p className="text-gray-700 mb-4">
            MedEase implements industry-standard security measures including secure servers, SSL, access controls, and secure payment processing via trusted third parties. However, no system is 100% secure — users should maintain password confidentiality.
          </p>

          <h2 className="text-xl font-semibold mb-2">5. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            We may use trusted third-party services for payment processing, analytics and email. These providers only access necessary data and are obligated to protect it.
          </p>

          <h2 className="text-xl font-semibold mb-2">6. Student Responsibilities</h2>
          <p className="text-gray-700 mb-4">
            Users agree to provide accurate information, maintain account confidentiality and not share course access. Account sharing may result in suspension.
          </p>

          <h2 className="text-xl font-semibold mb-2">7. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain student data for academic record maintenance, legal compliance and platform improvement. You may request account deletion by contacting us.
          </p>

          <h2 className="text-xl font-semibold mb-2">8. Changes to Privacy Policy</h2>
          <p className="text-gray-700 mb-4">MedEase reserves the right to update this policy. Updates will be posted on the website.</p>

          <h2 className="text-xl font-semibold mb-2">9. Contact Information</h2>
          <p className="text-gray-700">Email: <a href="mailto:medeasebyheal@gmail.com" className="text-primary hover:underline">medeasebyheal@gmail.com</a></p>
          <p className="text-gray-700">Phone: <a href="tel:+923290123208" className="text-primary hover:underline">0329 0123208</a></p>
          <p className="text-gray-700">Location: Karachi, Pakistan</p>
        </main>
      </div>
    </section>
  );
}

