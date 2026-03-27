// frontend/src/components/doctor/DoctorProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FaUserMd, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaCamera,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaMoneyBillWave,
  FaStar,
  FaCheckCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const DoctorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    specialization: '',
    qualifications: '',
    years_of_experience: '',
    consultation_fee: '',
    hospital_name: '',
    hospital_address: '',
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    max_appointments_per_day: '',
    bio: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/doctors/profile');
      setProfile(response.data.profile);
      setFormData({
        first_name: response.data.profile.first_name || '',
        last_name: response.data.profile.last_name || '',
        specialization: response.data.profile.specialization || '',
        qualifications: response.data.profile.qualifications || '',
        years_of_experience: response.data.profile.years_of_experience || '',
        consultation_fee: response.data.profile.consultation_fee || '',
        hospital_name: response.data.profile.hospital_name || '',
        hospital_address: response.data.profile.hospital_address || '',
        available_days: response.data.profile.available_days || [],
        available_time_start: response.data.profile.available_time_start || '09:00',
        available_time_end: response.data.profile.available_time_end || '17:00',
        max_appointments_per_day: response.data.profile.max_appointments_per_day || 10,
        bio: response.data.profile.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/doctors/profile', formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post('/api/doctors/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, profile_image_url: response.data.url }));
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
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
      <div className="bg-linear-to-r from-secondary-600 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Doctor Profile</h1>
              <p className="mt-2 text-secondary-100">Manage your professional information</p>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className="bg-white text-secondary-600 px-4 py-2 rounded-lg hover:bg-secondary-50 transition-colors flex items-center"
            >
              {isEditing ? (
                saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-600 border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )
              ) : (
                <>
                  <FaEdit className="mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto overflow-hidden">
                  {profile?.profile_image_url ? (
                    <img 
                      src={profile.profile_image_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserMd className="h-16 w-16 text-primary-600" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors">
                    <FaCamera className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mt-4">
                Dr. {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-primary-600">{profile?.specialization}</p>
              
              <div className="mt-4 flex items-center justify-center space-x-2">
                <FaStar className="text-yellow-400" />
                <span className="text-sm text-gray-600">
                  {profile?.rating || '4.8'} ({profile?.total_reviews || '0'} reviews)
                </span>
                {profile?.is_verified && (
                  <span className="flex items-center text-green-600 text-sm">
                    <FaCheckCircle className="ml-1" />
                    Verified
                  </span>
                )}
              </div>
              
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center text-gray-600">
                  <FaEnvelope className="mr-3 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaPhone className="mr-3 text-gray-400" />
                  <span>{user?.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaCalendarAlt className="mr-3 text-gray-400" />
                  <span>{profile?.years_of_experience}+ years experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing && 'bg-gray-50'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifications
                  </label>
                  <textarea
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    placeholder="e.g., MD, FACOG, MRCOG"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee (₦)
                    </label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital/Clinic Name
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing && 'bg-gray-50'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Address
                  </label>
                  <textarea
                    name="hospital_address"
                    value={formData.hospital_address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`input-field ${!isEditing && 'bg-gray-50'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => isEditing && handleDayToggle(day)}
                        disabled={!isEditing}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.available_days.includes(day)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${!isEditing && 'cursor-default'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="available_time_start"
                      value={formData.available_time_start}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="available_time_end"
                      value={formData.available_time_end}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Appointments/Day
                    </label>
                    <input
                      type="number"
                      name="max_appointments_per_day"
                      value={formData.max_appointments_per_day}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio / About
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="4"
                    className={`input-field ${!isEditing && 'bg-gray-50'}`}
                    placeholder="Tell patients about your experience, approach to care, and what makes you unique..."
                  />
                </div>

                {!isEditing && (
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">Profile Visibility</h4>
                    <p className="text-sm text-blue-700">
                      Your profile is visible to patients searching for doctors. 
                      Patients can book appointments based on your availability and consultation fee.
                      {!profile?.is_verified && (
                        <span className="block mt-2 text-yellow-700">
                          ⚠️ Your profile is pending verification. Patients can still book appointments, but verification adds credibility.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    className="btn-secondary"
                  >
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;