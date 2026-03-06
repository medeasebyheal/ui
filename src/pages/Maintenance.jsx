import React from 'react';
import { Link } from 'react-router-dom';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <div className="max-w-2xl text-center bg-white rounded-2xl shadow-lg p-10">
        <div className="flex items-center justify-center mb-4">
          <img src="/logo.png" alt="MedEase" className="w-20 h-auto" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-4">We'll be back soon</h1>
        <p className="text-slate-600 mb-6">
          Our website is currently under scheduled maintenance. We appreciate your patience — we're working to improve the experience and will be back shortly.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          If you need urgent help, contact us on WhatsApp:&nbsp;
          <a href="https://wa.me/923290123208" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            +92 329 0123208
          </a>
        </p>
        <div>
         
        </div>
      </div>
    </div>
  );
}

