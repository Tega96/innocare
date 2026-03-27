// frontend/src/components/auth/DoctorRegister.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUserMd, FaEnvelope, FaLock, FaPhone, FaStethoscope, 
  FaMoneyBillWave, FaHospital, FaGraduationCap, FaClock, 
  FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaPlus, FaTimes 
} from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import toast from 'react-hot-toast';

const DoctorRegister = () => {
  const navigate = useNavigate();
  const { registerDoctor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    consultationFee: '',
    hospitalName: '',
    hospitalAddress: '',
    yearsOfExperience: '',
    qualifications: '',
    availableDays: [],
    availableTimeStart: '09:00',
    availableTimeEnd: '17:00',
    maxAppointmentsPerDay: '10'
  });
  
  const [errors, setErrors] = useState({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
    else if (isNaN(formData.consultationFee) || formData.consultationFee <= 0) newErrors.consultationFee = 'Valid consultation fee is required';
    if (!formData.hospitalName) newErrors.hospitalName = 'Hospital name is required';
    if (formData.availableDays.length === 0) newErrors.availableDays = 'Select at least one available day';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone: value }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
    if (errors.availableDays) {
      setErrors(prev => ({ ...prev, availableDays: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    const result = await registerDoctor({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      specialization: formData.specialization,
      consultationFee: parseFloat(formData.consultationFee),
      hospitalName: formData.hospitalName,
      hospitalAddress: formData.hospitalAddress,
      yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
      qualifications: formData.qualifications,
      availableDays: formData.availableDays,
      availableTimeStart: formData.availableTimeStart,
      availableTimeEnd: formData.availableTimeEnd,
      maxAppointmentsPerDay: parseInt(formData.maxAppointmentsPerDay)
    });
    
    if (result.success) {
      navigate('/verify', { state: { email: formData.email, phone: formData.phone, role: 'doctor' } });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-3 rounded-full">
              <FaUserMd className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join as a Doctor
          </h2>
          <p className="mt-2 text-gray-600">
            Help expecting mothers receive quality care and grow your practice
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <PhoneInput
                    country={'ng'}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    inputClass={`w-full !pl-12 !py-2 !border ${errors.phone ? '!border-red-500' : '!border-gray-300'} !rounded-lg`}
                    containerClass="w-full"
                    buttonClass="!border !border-gray-300 !rounded-l-lg"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaStethoscope className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.specialization ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Specialization</option>
                      <option value="Obstetrician">Obstetrician</option>
                      <option value="Maternal-Fetal Medicine">Maternal-Fetal Medicine</option>
                      <option value="Perinatologist">Perinatologist</option>
                      <option value="Midwife">Midwife</option>
                      <option value="Family Medicine">Family Medicine</option>
                      <option value="Nutritionist">Nutritionist</option>
                    </select>
                  </div>
                  {errors.specialization && <p className="mt-1 text-xs text-red-600">{errors.specialization}</p>}
                </div>
                
                <div>
                  <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee (₦) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.consultationFee ? 'border-red-500' : ''}`}
                      placeholder="e.g., 15000"
                    />
                  </div>
                  {errors.consultationFee && <p className="mt-1 text-xs text-red-600">{errors.consultationFee}</p>}
                  <p className="mt-1 text-xs text-gray-500">Platform fee: 10% of consultation fee</p>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                  Qualifications
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="qualifications"
                    name="qualifications"
                    type="text"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g., MD, FACOG, MRCOG"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 10"
                    min="0"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxAppointmentsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Appointments Per Day
                  </label>
                  <input
                    id="maxAppointmentsPerDay"
                    name="maxAppointmentsPerDay"
                    type="number"
                    value={formData.maxAppointmentsPerDay}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>

            {/* Practice Location */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Practice Location</h3>
              
              <div>
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaHospital className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    type="text"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.hospitalName ? 'border-red-500' : ''}`}
                    placeholder="Enter hospital name"
                  />
                </div>
                {errors.hospitalName && <p className="mt-1 text-xs text-red-600">{errors.hospitalName}</p>}
              </div>

              <div className="mt-4">
                <label htmlFor="hospitalAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="hospitalAddress"
                    name="hospitalAddress"
                    value={formData.hospitalAddress}
                    onChange={handleChange}
                    rows="2"
                    className="input-field pl-10"
                    placeholder="Enter full hospital address"
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.availableDays.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {errors.availableDays && <p className="mt-1 text-xs text-red-600">{errors.availableDays}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="availableTimeStart" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="availableTimeStart"
                      name="availableTimeStart"
                      type="time"
                      value={formData.availableTimeStart}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="availableTimeEnd" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="availableTimeEnd"
                      name="availableTimeEnd"
                      type="time"
                      value={formData.availableTimeEnd}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Register as Doctor'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have a doctor account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;