import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, planKey }) {
  if (!isOpen) return null;

  const returnUrl = planKey ? `/checkout?plan=${planKey}` : '/checkout';
  const loginUrl = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  const registerUrl = `/register?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
          Continue to Checkout
        </h3>
        <p className="text-gray-600 mb-6">
          Login or register to continue to checkout.
        </p>
        <div className="flex gap-3">
          <Link
            to={loginUrl}
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold text-center border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to={registerUrl}
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold text-center bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
