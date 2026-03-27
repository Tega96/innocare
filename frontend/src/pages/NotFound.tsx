// frontend/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary-100 rounded-full animate-pulse-slow"></div>
            </div>
            <div className="relative">
              <svg className="w-48 h-48 mx-auto text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center btn-primary px-6 py-3 mr-4"
          >
            <FaHome className="mr-2" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center btn-secondary px-6 py-3"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
        
        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">You might find these helpful:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="text-primary-600 hover:text-primary-700">Home</Link>
            <span className="text-gray-300">|</span>
            <Link to="/about" className="text-primary-600 hover:text-primary-700">About Us</Link>
            <span className="text-gray-300">|</span>
            <Link to="/contact" className="text-primary-600 hover:text-primary-700">Contact</Link>
            <span className="text-gray-300">|</span>
            <Link to="/login" className="text-primary-600 hover:text-primary-700">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;