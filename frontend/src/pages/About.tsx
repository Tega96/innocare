// frontend/src/pages/About.jsx
import React from 'react';
import { FaHeart, FaStethoscope, FaHandHoldingHeart, FaUsers, FaAward, FaGlobe } from 'react-icons/fa';

const About = () => {
  const values = [
    {
      icon: FaHeart,
      title: 'Compassionate Care',
      description: 'We treat every mother with the utmost care and respect, understanding the unique needs of pregnancy'
    },
    {
      icon: FaStethoscope,
      title: 'Expert Medical Knowledge',
      description: 'Our doctors are specialized obstetricians with years of experience in maternal health'
    },
    {
      icon: FaHandHoldingHeart,
      title: 'Patient-Centered Approach',
      description: 'We put mothers at the center of everything we do, ensuring personalized care plans'
    },
    {
      icon: FaUsers,
      title: 'Community Support',
      description: 'Building a supportive community where mothers can share experiences and find encouragement'
    }
  ];

  const milestones = [
    { year: '2020', title: 'Founded', description: 'InnoCare was established with a vision to transform maternal healthcare' },
    { year: '2021', title: 'First 1000 Mothers', description: 'Reached our first 1000 mothers served across Nigeria' },
    { year: '2022', title: 'Expansion', Description: 'Expanded our network to 50+ specialized doctors' },
    { year: '2023', title: 'Innovation Award', description: 'Received recognition for innovation in telemedicine' },
    { year: '2024', title: 'National Reach', description: 'Now serving mothers across all 36 states' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About InnoCare</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Revolutionizing maternal healthcare through technology and compassion
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To provide accessible, quality maternal healthcare to every expecting mother,
                leveraging technology to bridge the gap between patients and specialized doctors.
              </p>
              <p className="text-lg text-gray-600">
                We believe that every mother deserves the best care during pregnancy,
                regardless of their location or circumstances. Our platform makes it possible
                to connect with expert obstetricians from anywhere, at any time.
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Mother and baby"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Journey */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">Milestones that shaped InnoCare</p>
          </div>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-primary-200 h-full"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="text-2xl font-bold text-primary-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full mt-6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Leadership</h2>
            <p className="text-xl text-gray-600">Dedicated professionals committed to maternal health</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <img
                src="https://randomuser.me/api/portraits/women/3.jpg"
                alt="Dr. Amara Nwosu"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">Dr. Amara Nwosu</h3>
              <p className="text-primary-600 mb-2">Founder & CEO</p>
              <p className="text-gray-600">15+ years in maternal healthcare</p>
            </div>
            <div className="text-center">
              <img
                src="https://randomuser.me/api/portraits/men/2.jpg"
                alt="Dr. Michael Okafor"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">Dr. Michael Okafor</h3>
              <p className="text-primary-600 mb-2">Chief Medical Officer</p>
              <p className="text-gray-600">Specialist in Maternal-Fetal Medicine</p>
            </div>
            <div className="text-center">
              <img
                src="https://randomuser.me/api/portraits/women/4.jpg"
                alt="Sarah Johnson"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">Sarah Johnson</h3>
              <p className="text-primary-600 mb-2">Head of Patient Care</p>
              <p className="text-gray-600">Patient advocacy & support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <FaUsers className="h-12 w-12 mx-auto mb-3 text-primary-200" />
              <div className="text-3xl font-bold mb-1">5000+</div>
              <div>Mothers Served</div>
            </div>
            <div>
              <FaStethoscope className="h-12 w-12 mx-auto mb-3 text-primary-200" />
              <div className="text-3xl font-bold mb-1">50+</div>
              <div>Expert Doctors</div>
            </div>
            <div>
              <FaGlobe className="h-12 w-12 mx-auto mb-3 text-primary-200" />
              <div className="text-3xl font-bold mb-1">36</div>
              <div>States Covered</div>
            </div>
            <div>
              <FaAward className="h-12 w-12 mx-auto mb-3 text-primary-200" />
              <div className="text-3xl font-bold mb-1">98%</div>
              <div>Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;