// frontend/src/components/patient/PatientAppointments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarAlt, FaVideo, FaMapMarkerAlt, FaClock, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      let url = '/api/appointments/patient';
      if (filter === 'upcoming') {
        url += '?status=confirmed';
      } else if (filter === 'past') {
        url += '?status=completed';
      } else if (filter === 'cancelled') {
        url += '?status=cancelled';
      }
      
      const response = await axios.get(url);
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? Cancellations must be made at least 24 hours in advance.')) {
      return;
    }
    
    try {
      await axios.put(`/api/appointments/${appointmentId}/cancel`, {
        reason: 'Cancelled by patient'
      });
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="mt-2 text-primary-100">Manage and track all your appointments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'cancelled'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancelled
          </button>
          <Link
            to="/patient/search-doctors"
            className="ml-auto bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Book New Appointment
          </Link>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                        {apt.type === 'video' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            <FaVideo className="inline mr-1" size={12} />
                            Video Consultation
                          </span>
                        )}
                        {apt.type === 'in_person' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            <FaMapMarkerAlt className="inline mr-1" size={12} />
                            In-Person Visit
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>{formatDate(apt.appointment_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaClock className="mr-2 text-gray-400" />
                          <span>{apt.start_time} - {apt.end_time}</span>
                        </div>
                      </div>
                      
                      {apt.symptoms && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Symptoms:</span> {apt.symptoms}
                        </div>
                      )}
                      
                      {apt.notes && (
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium">Notes:</span> {apt.notes}
                        </div>
                      )}
                      
                      {apt.status === 'confirmed' && (
                        <div className="mt-3 flex space-x-3">
                          {apt.type === 'video' && (
                            <Link
                              to={`/patient/video-call/${apt.id}`}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <FaVideo className="inline mr-2" />
                              Join Call
                            </Link>
                          )}
                          <Link
                            to={`/patient/chat/${apt.doctor_id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <FaCheckCircle className="inline mr-2" />
                            Message Doctor
                          </Link>
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            <FaTimesCircle className="inline mr-2" />
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {apt.status === 'completed' && (
                        <div className="mt-3">
                          <Link
                            to={`/patient/chat/${apt.doctor_id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <FaCheckCircle className="inline mr-2" />
                            Review & Feedback
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* Payment Status */}
                    <div className="mt-4 md:mt-0 md:ml-6">
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        apt.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : apt.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apt.payment_status === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                      </div>
                      {apt.payment_amount && (
                        <div className="mt-2 text-sm text-gray-600">
                          Amount: ₦{apt.payment_amount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FaCalendarAlt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'upcoming' 
                  ? "You don't have any upcoming appointments."
                  : filter === 'past'
                  ? "You haven't completed any appointments yet."
                  : "You don't have any cancelled appointments."}
              </p>
              <Link
                to="/patient/search-doctors"
                className="btn-primary inline-block"
              >
                Book an Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;