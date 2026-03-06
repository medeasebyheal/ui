import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="MedEase Logo" 
                className="h-10 w-auto sm:h-12"
              />
              <h3 className="text-2xl font-heading font-bold text-white">MedEase</h3>
            </div>
            <p className="text-sm sm:text-base leading-relaxed">
              Your ultimate medical exam preparation partner. Empowering future doctors with smart tools and expert guidance.
            </p>
            <div className="flex gap-4 pt-2">
              <a 
                href="https://www.facebook.com/profile.php?id=61577864026519" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://www.instagram.com/medeasebyheal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://www.youtube.com/@Medeasebyheal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors duration-300 group"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-heading font-bold text-white mb-4 sm:mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/modules" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to={{ pathname: '/', hash: '#testimonials' }} className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-heading font-bold text-white mb-4 sm:mb-6">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/modules" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  MCQ Database
                </Link>
              </li>
              <li>
                <Link to="/modules" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  OSPE Practice
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Live Classes
                </Link>
              </li>
              <li>
                <Link to="/modules" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Recorded Lectures
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Past Papers
                </Link>
              </li>
              <li>
                <Link to="/modules" className="text-sm sm:text-base hover:text-primary transition-colors duration-300">
                  Study Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-heading font-bold text-white mb-4 sm:mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base">
                    <a href="mailto:medeasebyheal@gmail.com" className="hover:text-primary transition-colors">
                      medeasebyheal@gmail.com
                    </a>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base">
                    <a href="tel:+923290123208" className="hover:text-primary transition-colors">
                      0329 0123208
                    </a>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base">
                    Karachi, Pakistan
                  </p>
                </div>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-sm font-heading font-semibold text-white mb-3">Subscribe to Newsletter</h5>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-primary transition-colors min-w-0"
                />
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {new Date().getFullYear()} MedEase. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

