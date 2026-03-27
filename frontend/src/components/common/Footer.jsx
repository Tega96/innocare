// frontend/src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBaby, 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin, 
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHeart,
  FaShieldAlt,
  FaClock,
  FaAmbulance
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/faq', label: 'FAQ' },
  ];

  const patientLinks = [
    { to: '/patient/search-doctors', label: 'Find a Doctor' },
    { to: '/patient/appointments', label: 'Book Appointment' },
    { to: '/patient/pharmacy', label: 'Pharmacy' },
    { to: '/patient/health-status', label: 'Health Tracking' },
    { to: '/patient/medical-records', label: 'Medical Records' },
  ];

  const doctorLinks = [
    { to: '/doctor/register', label: 'Join as Doctor' },
    { to: '/doctor/dashboard', label: 'Doctor Dashboard' },
    { to: '/doctor/earnings', label: 'Earnings' },
    { to: '/doctor/patients', label: 'Patient Management' },
  ];

  const contactInfo = [
    { icon: FaPhone, text: '+234 123 456 7890', href: 'tel:+2341234567890' },
    { icon: FaEnvelope, text: 'support@InnoCare.com', href: 'mailto:support@InnoCare.com' },
    { icon: FaMapMarkerAlt, text: '123 Health Street, Victoria Island, Lagos, Nigeria', href: null },
    { icon: FaClock, text: '24/7 Emergency Support Available', href: null },
  ];

  const socialLinks = [
    { icon: FaFacebook, href: 'https://facebook.com/InnoCare', label: 'Facebook' },
    { icon: FaTwitter, href: 'https://twitter.com/InnoCare', label: 'Twitter' },
    { icon: FaInstagram, href: 'https://instagram.com/InnoCare', label: 'Instagram' },
    { icon: FaLinkedin, href: 'https://linkedin.com/company/InnoCare', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Emergency Banner */}
      <div className="bg-red-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <FaAmbulance className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">Emergency? Call our 24/7 helpline: +234 123 456 7890</span>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <FaBaby className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">InnoCare</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Empowering mothers with expert care, personalized support, and convenient access to quality maternal healthcare.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 p-2 rounded-lg hover:bg-primary-600 transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Patients */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Patients</h3>
            <ul className="space-y-2">
              {patientLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Doctors & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Doctors</h3>
            <ul className="space-y-2 mb-6">
              {doctorLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2">
              {contactInfo.map((info, index) => (
                <li key={index}>
                  {info.href ? (
                    <a
                      href={info.href}
                      className="flex items-center space-x-2 text-gray-400 hover:text-primary-400 transition-colors text-sm"
                    >
                      <info.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{info.text}</span>
                    </a>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <info.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{info.text}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-white font-semibold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-gray-400 text-sm">
                Get pregnancy tips, health updates, and special offers delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            &copy; {currentYear} InnoCare. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-primary-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/accessibility" className="hover:text-primary-400 transition-colors">
              Accessibility
            </Link>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <FaHeart className="h-3 w-3 text-red-500" />
            <span>Made with love for expecting mothers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;