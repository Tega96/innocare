// frontend/src/components/doctor/AppointmentManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FaCalendarAlt, FaVideo, FaFileMedical, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';

const AppointmentManager = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescription, setPrescription] = useState({
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchAppointments();
  }, [filter, selectedDate]);

  const fetchAppointments = async () => {
    try {
      let url = '/api/appointments/doctor';
      if (filter === 'today') {
        url += `?date=${new Date().toISOString().split('T')[0]}`;
      } else if (filter === 'upcoming') {
        url += '?status=confirmed';
      } else if (filter === 'date' && selectedDate) {
        url += `?date=${selectedDate}`;
      }
      
      const response = await axios.get(url);
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const startVideoCall = (appointmentId) => {
    window.open(`/doctor/video-call/${appointmentId}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      'no_show': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
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
      <div className="bg-linear-to-r from-secondary-600 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Appointment Manager</h1>
          <p className="mt-2 text-secondary-100">Manage your appointments and patient consultations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'today' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'upcoming' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('date')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'date' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Select Date
            </button>
            {filter === 'date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            )}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                        {apt.type === 'video' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            <FaVideo className="inline mr-1" size={12} />
                            Video Call
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.start_time}
                        </div>
                        <div className="flex items-center">
                          <FaClock className="mr-2 text-gray-400" />
                          Duration: 1 hour
                        </div>
                        {apt.symptoms && (
                          <div className="flex items-center">
                            <FaFileMedical className="mr-2 text-gray-400" />
                            Symptoms: {apt.symptoms}
                          </div>
                        )}
                      </div>
                      
                      {apt.notes && (
                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          Notes: {apt.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {apt.status === 'confirmed' && (
                        <>
                          {apt.type === 'video' && (
                            <button
                              onClick={() => startVideoCall(apt.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <FaVideo className="inline mr-2" />
                              Start Call
                            </button>
                          )}
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <FaCheckCircle className="inline mr-2" />
                            Complete
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <FaTimesCircle className="inline mr-2" />
                            Cancel
                          </button>
                        </>
                      )}
                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <FaCheckCircle className="inline mr-2" />
                            Confirm
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <FaTimesCircle className="inline mr-2" />
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FaCalendarAlt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">No appointments found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManager;