// frontend/src/components/doctor/DoctorDashboard.jsx
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
  FaSpinner,
  FaUserMd,
  FaStar,
  FaArrowRight,
  FaPrescription,
  FaFileMedical
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    thisWeekAppointments: 0,
    completedAppointments: 0,
    satisfactionRate: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [appointmentTrends, setAppointmentTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const [todayRes, upcomingRes, patientsRes, earningsRes, trendsRes] = await Promise.all([
        axios.get(`/api/appointments/doctor?date=${today}`),
        axios.get('/api/appointments/doctor?status=confirmed&limit=5'),
        axios.get('/api/doctors/patients?limit=5'),
        axios.get(`/api/doctors/earnings?range=${selectedPeriod}`),
        axios.get(`/api/doctors/appointment-trends?range=${selectedPeriod}`)
      ]);
      
      const todayAppts = todayRes.data.appointments || [];
      const confirmedToday = todayAppts.filter(apt => apt.status === 'confirmed');
      const completedAppts = todayAppts.filter(apt => apt.status === 'completed');
      
      setTodayAppointments(todayAppts.slice(0, 5));
      setUpcomingAppointments(upcomingRes.data.appointments || []);
      setRecentPatients(patientsRes.data.patients || []);
      
      setStats({
        todayAppointments: confirmedToday.length,
        totalPatients: patientsRes.data.total || 0,
        totalEarnings: earningsRes.data.totalEarnings || 0,
        pendingEarnings: earningsRes.data.pendingEarnings || 0,
        thisWeekAppointments: trendsRes.data.thisWeekCount || 0,
        completedAppointments: trendsRes.data.completedCount || 0,
        satisfactionRate: earningsRes.data.satisfactionRate || 98
      });
      
      // Prepare earnings chart data
      if (earningsRes.data.weeklyData) {
        setEarningsData({
          labels: earningsRes.data.weeklyData.map(d => d.day),
          datasets: [
            {
              label: 'Earnings (₦)',
              data: earningsRes.data.weeklyData.map(d => d.amount),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(34, 197, 94)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        });
      }
      
      // Prepare appointment trends chart
      if (trendsRes.data.trends) {
        setAppointmentTrends({
          labels: trendsRes.data.trends.map(d => d.date),
          datasets: [
            {
              label: 'Appointments',
              data: trendsRes.data.trends.map(d => d.count),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatTime = (time) => {
    return time.slice(0, 5);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPatientInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: FaCalendarAlt,
      color: 'bg-blue-500',
      link: '/doctor/appointments',
      subtext: `${stats.thisWeekAppointments} this week`
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: FaUsers,
      color: 'bg-green-500',
      link: '/doctor/patients',
      subtext: 'Active patients'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      icon: FaMoneyBillWave,
      color: 'bg-purple-500',
      link: '/doctor/earnings',
      subtext: `Pending: ${formatCurrency(stats.pendingEarnings)}`
    },
    {
      title: 'Satisfaction Rate',
      value: `${stats.satisfactionRate}%`,
      icon: FaStar,
      color: 'bg-yellow-500',
      link: '/doctor/reviews',
      subtext: 'Based on patient feedback'
    }
  ];

  const quickActions = [
    { 
      title: 'Start Video Call', 
      icon: FaVideo, 
      link: '/doctor/appointments', 
      color: 'bg-red-100 text-red-600',
      description: 'Join active consultations'
    },
    { 
      title: 'View Appointments', 
      icon: FaCalendarAlt, 
      link: '/doctor/appointments', 
      color: 'bg-blue-100 text-blue-600',
      description: 'Manage your schedule'
    },
    { 
      title: 'Message Patients', 
      icon: FaComments, 
      link: '/doctor/chat', 
      color: 'bg-green-100 text-green-600',
      description: 'Quick responses'
    },
    { 
      title: 'Write Prescription', 
      icon: FaPrescription, 
      link: '/doctor/appointments', 
      color: 'bg-purple-100 text-purple-600',
      description: 'Issue medications'
    },
    { 
      title: 'Patient Health', 
      icon: FaChartLine, 
      link: '/doctor/patients', 
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Monitor vitals'
    },
    { 
      title: 'Medical Records', 
      icon: FaFileMedical, 
      link: '/doctor/patients', 
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Access records'
    }
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, Dr. {user?.profile?.first_name}!
              </h1>
              <p className="mt-2 text-secondary-100">
                Here's what's happening with your practice today
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white text-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <Link
                to="/doctor/profile"
                className="bg-white text-secondary-600 px-4 py-2 rounded-lg hover:bg-secondary-50 transition-colors text-sm font-medium"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Link 
              key={index} 
              to={stat.link} 
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                  )}
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
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200 border border-gray-100 group"
              >
                <div className={`${action.color} p-3 rounded-full inline-flex mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">{action.title}</p>
                <p className="text-xs text-gray-400 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Earnings Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">₦{formatCurrency(stats.totalEarnings)} total</span>
                <FaArrowRight className="text-gray-400 h-4 w-4" />
              </div>
            </div>
            {earningsData ? (
              <Line
                data={earningsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `₦${context.parsed.y.toLocaleString()}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: (value) => `₦${value.toLocaleString()}`
                      },
                      grid: {
                        color: '#e5e7eb'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaMoneyBillWave className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No earnings data available yet</p>
                <p className="text-sm">Complete appointments to start earning</p>
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <Link to="/doctor/appointments" className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center">
                View all
                <FaArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayAppointments.map((apt, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center">
                          <FaUserMd className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {apt.patient_first_name} {apt.patient_last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.type === 'video' ? 'Video Call' : 'In-Person'} • {formatTime(apt.start_time)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(apt.status)}`}>
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                    {apt.status === 'confirmed' && (
                      <div className="flex space-x-2 mt-2">
                        {apt.type === 'video' && (
                          <Link
                            to={`/doctor/video-call/${apt.id}`}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Start Call
                          </Link>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              await axios.put(`/api/appointments/${apt.id}/status`, { status: 'completed' });
                              toast.success('Appointment marked as completed');
                              fetchDashboardData();
                            } catch (error) {
                              toast.error('Failed to update status');
                            }
                          }}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No appointments scheduled for today</p>
                <p className="text-sm mt-1">Enjoy your free time!</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Appointment Trends */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Appointment Trends</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {stats.completedAppointments} completed
                </span>
              </div>
            </div>
            {appointmentTrends ? (
              <Line
                data={appointmentTrends}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y} appointments`
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        stepSize: 1
                      },
                      grid: {
                        color: '#e5e7eb'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaChartLine className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No appointment data available</p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              <Link to="/doctor/appointments" className="text-sm text-secondary-600 hover:text-secondary-700">
                View all
              </Link>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {getPatientInitials(apt.patient_first_name, apt.patient_last_name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <FaCalendarAlt className="h-3 w-3" />
                          <span>{format(new Date(apt.appointment_date), 'MMM dd')}</span>
                          <FaClock className="h-3 w-3 ml-1" />
                          <span>{formatTime(apt.start_time)}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/doctor/monitor/${apt.patient_id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No upcoming appointments</p>
                <p className="text-sm">Check back later for new bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recently Active Patients</h2>
            <Link to="/doctor/patients" className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center">
              View all patients
              <FaArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          {recentPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pregnancy Week</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPatients.map((patient, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center">
                            <FaUserMd className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">
                          {patient.current_pregnancy_week ? `Week ${patient.current_pregnancy_week}` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {patient.last_visit ? format(new Date(patient.last_visit), 'MMM dd, yyyy') : 'Not yet'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/doctor/monitor/${patient.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Monitor"
                          >
                            Monitor
                          </Link>
                          <Link
                            to={`/doctor/chat/${patient.user_id}`}
                            className="text-green-600 hover:text-green-800 text-sm"
                            title="Message"
                          >
                            Message
                          </Link>
                          <Link
                            to={`/doctor/appointments?patient=${patient.id}`}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                            title="History"
                          >
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaUsers className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No patients yet</p>
              <p className="text-sm">Patients will appear here once they book appointments</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-linear-to-r from-secondary-50 to-primary-50 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-secondary-100 rounded-full p-3">
              <FaHeartbeat className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Practice Tips</h3>
              <p className="text-gray-600 mt-1">
                You have {stats.todayAppointments} appointments today. Don't forget to prepare your consultation notes.
                {stats.pendingEarnings > 0 && ` You have ${formatCurrency(stats.pendingEarnings)} pending earnings ready for withdrawal.`}
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => window.open('/doctor/earnings', '_blank')}
                  className="text-sm bg-white text-secondary-600 px-3 py-1 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Withdraw Earnings
                </button>
                <button
                  onClick={() => window.open('/doctor/profile', '_blank')}
                  className="text-sm bg-white text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Update Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;