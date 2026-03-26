// frontend/src/pages/Contact.jsx
import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post('/api/contact', formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FaPhone,
      title: 'Phone',
      details: ['+234 123 456 7890', '+234 123 456 7891'],
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      details: ['support@maternitycare.com', 'info@maternitycare.com'],
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Address',
      details: ['123 Health Street, Victoria Island', 'Lagos, Nigeria'],
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: FaClock,
      title: 'Working Hours',
      details: ['Monday - Friday: 8:00 AM - 8:00 PM', 'Saturday: 9:00 AM - 5:00 PM', 'Sunday: Emergency Only'],
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'Simply sign up as a patient, search for a doctor, select your preferred time slot, and confirm your appointment. You\'ll receive a confirmation email and SMS.'
    },
    {
      question: 'What if I need a prescription?',
      answer: 'Doctors can issue prescriptions during consultations. You can then order medications through our pharmacy with the prescription.'
    },
    {
      question: 'Are video consultations secure?',
      answer: 'Yes, all video consultations are end-to-end encrypted and comply with healthcare privacy regulations.'
    },
    {
      question: 'How do I pay for services?',
      answer: 'We accept payments via Interswitch. You can pay for consultations and medications securely through our platform.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'Refunds are available for cancellations made at least 24 hours before the appointment. Contact support for assistance.'
    },
    {
      question: 'Is my health data secure?',
      answer: 'We take data security seriously. All health records are encrypted and stored securely in compliance with medical data protection standards.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Have questions? We're here to help you. Reach out to our support team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className={`${info.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <info.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
              {info.details.map((detail, idx) => (
                <p key={idx} className="text-gray-600 text-sm">{detail}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Contact Form and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="What is this about?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="input-field"
                  placeholder="Tell us how we can help..."
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
          
          {/* Map and Location */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="h-64 bg-gray-200">
              <iframe
                title="MaternityCare Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.596022459644!2d3.416797!3d6.453058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b1c1c1c1c1c%3A0x1c1c1c1c1c1c1c1c!2sLagos%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1640000000000!5m2!1sen!2sng"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Our Office</h3>
              <p className="text-gray-600 mb-4">
                123 Health Street, Victoria Island<br />
                Lagos, Nigeria
              </p>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <FaTwitter className="h-6 w-6" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors">
                  <FaLinkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Find quick answers to common questions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-16 bg-red-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Emergency? Need Immediate Help?</h2>
          <p className="text-red-600 mb-4">If you're experiencing a medical emergency, please call emergency services immediately.</p>
          <div className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg">
            <FaPhone className="mr-2" />
            Emergency Hotline: 911 or 112
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;