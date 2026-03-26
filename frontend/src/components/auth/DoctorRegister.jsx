import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaMoneyBillWave, 
  FaHeartbeat,
  FaVideo,
  FaComments,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaSpinner
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

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsRes = await axios.get(`/api/appointments/doctor?date=${today}`);
      const appointments = appointmentsRes.data.appointments || [];
      
      const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      
      setTodayAppointments(appointments.slice(0, 10));
      
      // Fetch total patients
      const patientsRes = await axios.get('/api/doctors/patients');
      const patients = patientsRes.data.patients || [];
      
      setRecentPatients(patients.slice(0, 5));
      
      // Fetch earnings
      const earningsRes = await axios.get('/api/doctors/earnings');
      const earnings = earningsRes.data;
      
      setStats({
        todayAppointments: confirmedAppointments.length,
        totalPatients: patients.length,
        totalEarnings: earnings.totalEarnings || 0,
        pendingEarnings: earnings.pendingEarnings || 0
      });
      
      // Prepare earnings chart data
      if (earnings.weeklyData) {
        setEarningsData({
          labels: earnings.weeklyData.map(d => d.day),
          datasets: [
            {
              label: 'Earnings (₦)',
              data: earnings.weeklyData.map(d => d.amount),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: FaCalendarAlt,
      color: 'bg-blue-500',
      link: '/doctor/appointments'
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: FaUsers,
      color: 'bg-green-500',
      link: '/doctor/patients'
    },
    {
      title: 'Total Earnings',
      value: `₦${stats.totalEarnings.toLocaleString()}`,
      icon: FaMoneyBillWave,
      color: 'bg-purple-500',
      link: '/doctor/earnings'
    },
    {
      title: 'Pending Earnings',
      value: `₦${stats.pendingEarnings.toLocaleString()}`,
      icon: FaClock,
      color: 'bg-orange-500',
      link: '/doctor/earnings'
    }
  ];

  const quickActions = [
    { title: 'Start Video Call', icon: FaVideo, link: '/doctor/appointments', color: 'bg-red-100 text-red-600' },
    { title: 'View Appointments', icon: FaCalendarAlt, link: '/doctor/appointments', color: 'bg-blue-100 text-blue-600' },
    { title: 'Message Patients', icon: FaComments, link: '/doctor/chat', color: 'bg-green-100 text-green-600' },
    { title: 'Write Prescription', icon: FaHeartbeat, link: '/doctor/appointments', color: 'bg-purple-100 text-purple-600' },
    { title: 'Patient Health Monitor', icon: FaChartLine, link: '/doctor/patients', color: 'bg-yellow-100 text-yellow-600' }
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
      <div className="bg-linear-to-r from-secondary-600 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">
            Welcome, Dr. {user?.profile?.first_name}!
          </h1>
          <p className="mt-2 text-secondary-100">
            Manage your patients, appointments, and track your earnings
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          {/* Earnings Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Earnings</h2>
              <select className="text-sm border rounded-lg px-3 py-1">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>
            {earningsData ? (
              <Line
                data={earningsData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `₦${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          return `₦${value.toLocaleString()}`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaMoneyBillWave className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No earnings data available yet</p>
              </div>
            )}
          </div>

          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <Link to="/doctor/appointments" className="text-sm text-secondary-600 hover:text-secondary-700">
                View all
              </Link>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayAppointments.map((apt, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Time: {apt.start_time}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      {apt.status === 'confirmed' && (
                        <>
                          <button className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-lg hover:bg-primary-200">
                            Start Call
                          </button>
                          <button className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">
                            Complete
                          </button>
                        </>
                      )}
                      {apt.type === 'video' && apt.status === 'confirmed' && (
                        <Link 
                          to={`/doctor/video-call/${apt.id}`}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"
                        >
                          Join Video
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
              <Link to="/doctor/patients" className="text-sm text-secondary-600 hover:text-secondary-700">
                View all
              </Link>
            </div>
            {recentPatients.length > 0 ? (
              <div className="space-y-3">
                {recentPatients.map((patient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center">
                        <FaUsers className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last visit: {patient.last_visit || 'Not yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/doctor/monitor/${patient.id}`}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200"
                      >
                        Monitor
                      </Link>
                      <Link 
                        to={`/doctor/chat/${patient.user_id}`}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaUsers className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No patients yet</p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Patient Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Appointment Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium text-gray-900">&lt; 2 min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Upcoming Reminders</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaClock className="text-yellow-500" />
                  <span>Follow-up with patient Sarah Johnson in 30 mins</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500" />
                  <span>Prescription for Mary Williams ready for review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;