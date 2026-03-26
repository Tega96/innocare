// frontend/src/components/patient/DoctorSearch.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSearch, 
  FaStar, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCalendarAlt,
  FaFilter,
  FaTimes,
  FaVideo,
  FaUserMd
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    location: '',
    maxFee: '',
    rating: '',
    availableDate: ''
  });

  const specializations = [
    'Obstetrician',
    'Maternal-Fetal Medicine',
    'Perinatologist',
    'Midwife',
    'Family Medicine',
    'Nutritionist'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/appointments/doctors/search');
      setDoctors(response.data.doctors);
      setFilteredDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...doctors];
    
    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by specialization
    if (filters.specialization) {
      filtered = filtered.filter(doc => doc.specialization === filters.specialization);
    }
    
    // Filter by max fee
    if (filters.maxFee) {
      filtered = filtered.filter(doc => doc.consultation_fee <= parseInt(filters.maxFee));
    }
    
    // Filter by rating
    if (filters.rating) {
      filtered = filtered.filter(doc => (doc.avg_rating || 0) >= parseFloat(filters.rating));
    }
    
    setFilteredDoctors(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      specialization: '',
      location: '',
      maxFee: '',
      rating: '',
      availableDate: ''
    });
    setSearchTerm('');
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating % 1) >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400 opacity-50" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Find a Doctor</h1>
          <p className="mt-2 text-primary-100">Connect with experienced maternity specialists</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaFilter className="mr-2" />
              Filters
              {Object.values(filters).some(f => f) && (
                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => handleFilterChange('specialization', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Consultation Fee (₦)
                  </label>
                  <select
                    value={filters.maxFee}
                    onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="50000">Up to ₦50,000</option>
                    <option value="100000">Up to ₦100,000</option>
                    <option value="150000">Up to ₦150,000</option>
                    <option value="200000">Up to ₦200,000</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3.0">3.0+ Stars</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    <FaTimes className="inline mr-1" />
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Found {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
                        <FaUserMd className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h3>
                        <p className="text-primary-600">{doctor.specialization}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {renderStars(doctor.avg_rating)}
                        <span className="ml-1 text-sm text-gray-600">
                          ({doctor.total_reviews || 0} reviews)
                        </span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-600">
                        {doctor.years_of_experience}+ years exp.
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {doctor.hospital_name && (
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" size={12} />
                          {doctor.hospital_name}
                        </div>
                      )}
                      {doctor.available_days && (
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" size={12} />
                          Available: {doctor.available_days.slice(0, 3).join(', ')}
                          {doctor.available_days.length > 3 && '...'}
                        </div>
                      )}
                      <div className="flex items-center">
                        <FaClock className="mr-2 text-gray-400" size={12} />
                        {doctor.available_time_start} - {doctor.available_time_end}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          ₦{doctor.consultation_fee}
                        </span>
                        <span className="text-sm text-gray-500">/session</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/patient/book-appointment/${doctor.id}`}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Book Appointment
                        </Link>
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaSearch className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Doctors Found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary inline-block"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center">
                  <FaUserMd className="h-10 w-10 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </h3>
                  <p className="text-primary-600 text-lg">{selectedDoctor.specialization}</p>
                  <div className="flex items-center mt-1">
                    {renderStars(selectedDoctor.avg_rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedDoctor.total_reviews || 0} patient reviews
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-600">
                    {selectedDoctor.qualifications || 'Experienced obstetrician specializing in maternal health.'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Qualifications</h4>
                  <p className="text-gray-600">
                    {selectedDoctor.qualifications || 'MBBS, MD, Specialized in Maternal-Fetal Medicine'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                  <p className="text-gray-600">{selectedDoctor.years_of_experience}+ years of practice</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Practice Location</h4>
                  <p className="text-gray-600">{selectedDoctor.hospital_name}</p>
                  <p className="text-gray-500 text-sm">{selectedDoctor.hospital_address}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Available Hours</h4>
                  <div className="space-y-1">
                    {selectedDoctor.available_days?.map(day => (
                      <div key={day} className="text-gray-600">
                        {day}: {selectedDoctor.available_time_start} - {selectedDoctor.available_time_end}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Consultation Fee</h4>
                  <p className="text-2xl font-bold text-primary-600">₦{selectedDoctor.consultation_fee}</p>
                  <p className="text-sm text-gray-500">per session (1 hour)</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex space-x-3">
                <Link
                  to={`/patient/book-appointment/${selectedDoctor.id}`}
                  className="flex-1 btn-primary text-center"
                  onClick={() => setSelectedDoctor(null)}
                >
                  Book Appointment
                </Link>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;