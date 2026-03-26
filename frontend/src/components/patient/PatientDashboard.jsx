import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaPills, 
  FaHeartbeat, 
  FaVideo, 
  FaComments,
  FaChartLine,
  FaFileMedical
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    prescriptions: 0,
    healthRecords: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments
      const appointmentsRes = await axios.get('/api/appointments/patient');
      const appointments = appointmentsRes.data.appointments || [];
      
      const upcoming = appointments.filter(
        apt => apt.status === 'confirmed' && new Date(apt.appointment_date) > new Date()
      );
      
      setStats({
        upcomingAppointments: upcoming.length,
        totalAppointments: appointments.length,
        prescriptions: 0,
        healthRecords: 0
      });
      
      setRecentAppointments(appointments.slice(0, 5));
      
      // Fetch health records for chart
      const healthRes = await axios.get('/api/health/records');
      const records = healthRes.data.records || [];
      
      if (records.length > 0) {
        const last7Days = records.slice(-7);
        setHealthData({
          labels: last7Days.map(r => new Date(r.recorded_at).toLocaleDateString()),
          datasets: [
            {
              label: 'Blood Pressure (Systolic)',
              data: last7Days.map(r => r.blood_pressure_systolic),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
            {
              label: 'Heart Rate',
              data: last7Days.map(r => r.heart_rate),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
            }
          ]
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      icon: FaCalendarAlt,
      color: 'bg-blue-500',
      link: '/patient/appointments'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: FaUserMd,
      color: 'bg-green-500',
      link: '/patient/appointments'
    },
    {
      title: 'Active Prescriptions',
      value: stats.prescriptions,
      icon: FaPills,
      color: 'bg-purple-500',
      link: '/patient/pharmacy'
    },
    {
      title: 'Health Records',
      value: stats.healthRecords,
      icon: FaHeartbeat,
      color: 'bg-red-500',
      link: '/patient/health-status'
    }
  ];

  const quickActions = [
    { title: 'Find a Doctor', icon: FaUserMd, link: '/patient/search-doctors', color: 'bg-primary-100 text-primary-600' },
    { title: 'Book Appointment', icon: FaCalendarAlt, link: '/patient/search-doctors', color: 'bg-secondary-100 text-secondary-600' },
    { title: 'Update Health Status', icon: FaHeartbeat, link: '/patient/health-status', color: 'bg-green-100 text-green-600' },
    { title: 'Order Medication', icon: FaPills, link: '/patient/pharmacy', color: 'bg-purple-100 text-purple-600' },
    { title: 'Medical Records', icon: FaFileMedical, link: '/patient/medical-records', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Start Video Call', icon: FaVideo, link: '/patient/appointments', color: 'bg-red-100 text-red-600' }
  ];

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
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.profile?.first_name}!
          </h1>
          <p className="mt-2 text-primary-100">
            Track your pregnancy journey, manage appointments, and stay healthy
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="dashboard-stat-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className={`${action.color} p-3 rounded-full inline-flex mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">{action.title}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Health Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Overview</h2>
            {healthData ? (
              <Line
                data={healthData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaChartLine className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No health data available yet</p>
                <Link to="/patient/health-status" className="text-primary-600 mt-2 inline-block">
                  Update your health status
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              <Link to="/patient/appointments" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((apt, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.start_time}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No upcoming appointments</p>
                <Link to="/patient/search-doctors" className="text-primary-600 mt-2 inline-block">
                  Book an appointment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Pregnancy Tips */}
        <div className="mt-8 bg-linear-to-r from-pink-50 to-lavender-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">💝 Pregnancy Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="font-medium text-gray-900">Stay Hydrated</p>
              <p className="text-sm text-gray-600 mt-1">Drink at least 8-10 glasses of water daily</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-medium text-gray-900">Prenatal Vitamins</p>
              <p className="text-sm text-gray-600 mt-1">Take your folic acid and prenatal vitamins regularly</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-medium text-gray-900">Gentle Exercise</p>
              <p className="text-sm text-gray-600 mt-1">Light walking and prenatal yoga can help</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;