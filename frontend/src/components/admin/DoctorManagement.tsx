// frontend/src/components/admin/DoctorManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaUserMd, 
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaFilter,
  FaTimes,
  FaStar,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaHospital
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors');
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
    
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        statusFilter === 'verified' ? doctor.is_verified : !doctor.is_verified
      );
    }
    
    setFilteredDoctors(filtered);
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      await axios.put(`/api/admin/doctors/${doctorId}/verify`);
      toast.success('Doctor verified successfully');
      fetchDoctors();
    } catch (error) {
      console.error('Error verifying doctor:', error);
      toast.error('Failed to verify doctor');
    }
  };

  const handleToggleStatus = async (doctorId, currentStatus) => {
    try {
      await axios.put(`/api/admin/doctors/${doctorId}/toggle-status`);
      toast.success(`Doctor ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchDoctors();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      toast.error('Failed to update doctor status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400 h-3 w-3" />);
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold">Doctor Management</h1>
            <p className="mt-2 text-primary-100">Verify and manage doctors on the platform</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUserMd className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Verified Doctors</p>
                <p className="text-2xl font-bold text-green-600">{doctors.filter(d => d.is_verified).length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">{doctors.filter(d => !d.is_verified).length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaTimesCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or specialization..."
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
              {statusFilter !== 'all' && (
                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Doctors</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Verification</option>
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="inline mr-1" />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
                      <FaUserMd className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      <p className="text-sm text-primary-600">{doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(doctor.rating)}
                    <span className="text-xs text-gray-500 ml-1">({doctor.total_reviews})</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaHospital className="mr-2 text-gray-400" size={14} />
                    {doctor.hospital_name || 'Not specified'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaMoneyBillWave className="mr-2 text-gray-400" size={14} />
                    Consultation: {formatCurrency(doctor.consultation_fee)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaCalendarAlt className="mr-2 text-gray-400" size={14} />
                    Joined: {format(new Date(doctor.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    {doctor.is_verified ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <FaCheckCircle className="mr-1" size={12} />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-600 text-sm">
                        <FaTimesCircle className="mr-1" size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowDoctorModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {!doctor.is_verified && (
                      <button
                        onClick={() => handleVerifyDoctor(doctor.id)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Verify Doctor"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleStatus(doctor.id, doctor.is_active)}
                      className={`p-1 ${doctor.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      title={doctor.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {doctor.is_active ? <FaTimesCircle /> : <FaCheckCircle />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaUserMd className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No doctors found</p>
          </div>
        )}
      </div>

      {/* Doctor Details Modal */}
      {showDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Doctor Details</h2>
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <FaUserMd className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </h3>
                  <p className="text-primary-600">{selectedDoctor.specialization}</p>
                  <div className="flex items-center mt-1">
                    {renderStars(selectedDoctor.rating)}
                    <span className="text-sm text-gray-500 ml-2">
                      {selectedDoctor.total_reviews || 0} reviews
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedDoctor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedDoctor.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="font-medium">{selectedDoctor.years_of_experience}+ years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-primary-600">{formatCurrency(selectedDoctor.consultation_fee)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Qualifications</p>
                  <p className="font-medium">{selectedDoctor.qualifications || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${selectedDoctor.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedDoctor.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Practice Information</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Hospital/Clinic</p>
                    <p className="font-medium">{selectedDoctor.hospital_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedDoctor.hospital_address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Days</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDoctor.available_days?.map(day => (
                        <span key={day} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {day}
                        </span>
                      )) || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Hours</p>
                    <p className="font-medium">
                      {selectedDoctor.available_time_start} - {selectedDoctor.available_time_end}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Appointments per Day</p>
                    <p className="font-medium">{selectedDoctor.max_appointments_per_day}</p>
                  </div>
                </div>
              </div>
              
              {selectedDoctor.bio && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                  <p className="text-gray-600">{selectedDoctor.bio}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              {!selectedDoctor.is_verified && (
                <button
                  onClick={() => {
                    handleVerifyDoctor(selectedDoctor.id);
                    setShowDoctorModal(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <FaCheckCircle className="inline mr-2" />
                  Verify Doctor
                </button>
              )}
              <button
                onClick={() => {
                  handleToggleStatus(selectedDoctor.id, selectedDoctor.is_active);
                  setShowDoctorModal(false);
                }}
                className={`px-4 py-2 rounded-lg ${
                  selectedDoctor.is_active
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {selectedDoctor.is_active ? 'Deactivate Doctor' : 'Activate Doctor'}
              </button>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;