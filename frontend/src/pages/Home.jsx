// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaPills, 
  FaVideo, 
  FaHeartbeat,
  FaShieldAlt,
  FaComments,
  FaArrowRight,
  FaBaby,
  FaStar
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: FaUserMd,
      title: 'Find Specialists',
      description: 'Connect with experienced obstetricians and maternity specialists',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: FaCalendarAlt,
      title: 'Easy Booking',
      description: 'Schedule appointments at your preferred time with 1-hour slots',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FaVideo,
      title: 'Video Consultations',
      description: 'Consult with doctors from the comfort of your home',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: FaPills,
      title: 'Pharmacy Delivery',
      description: 'Order medications with prescription or over-the-counter',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: FaHeartbeat,
      title: 'Health Monitoring',
      description: 'Track your vitals and pregnancy progress with charts',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: FaComments,
      title: 'Secure Messaging',
      description: 'Chat with your doctor and get quick responses',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  const stats = [
    { value: '500+', label: 'Happy Mothers' },
    { value: '50+', label: 'Expert Doctors' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Support Available' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'First-time Mother',
      content: 'InnoCare made my pregnancy journey so much easier. The doctors are professional and the video consultations are a lifesaver!',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      name: 'Mary Okafor',
      role: 'Mother of Twins',
      content: 'The health monitoring feature helped me track my blood pressure throughout my pregnancy. Highly recommended!',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      name: 'Dr. Michael Adele',
      role: 'Obstetrician',
      content: 'A great platform that connects us with patients seamlessly. The appointment management system is excellent.',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/men/1.jpg'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaBaby className="h-8 w-8 text-primary-200" />
                <span className="text-primary-200 font-semibold">InnoCare</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Expert Care for Your Pregnancy Journey
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Connect with specialized obstetricians, track your health, and get the care you deserve - all from the comfort of your home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/register/patient"
                      className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-center"
                    >
                      Get Started as Patient
                    </Link>
                    <Link
                      to="/register/doctor"
                      className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors text-center"
                    >
                      Join as Doctor
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/${user.role}/dashboard`}
                    className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-center"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Pregnancy Care"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Care for Expecting Mothers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for a healthy pregnancy journey, all in one place
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to get started with InnoCare
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up as a patient or doctor with email and phone verification</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Your Doctor</h3>
              <p className="text-gray-600">Search for specialists based on your needs and preferences</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Your Journey</h3>
              <p className="text-gray-600">Book appointments, track health, and get the care you need</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by mothers and doctors alike
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Pregnancy Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of mothers who trust InnoCare for their pregnancy care
          </p>
          <Link
            to="/register/patient"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Get Started Today
            <FaArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;