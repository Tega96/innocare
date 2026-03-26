
// frontend/src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUsers, 
  FaUserMd, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaPills,
  FaChartLine,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingDoctors: 0,
    pendingAppointments: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [userDistribution, setUserDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, appointmentsRes, revenueRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/recent-users'),
        axios.get('/api/admin/recent-appointments'),
        axios.get('/api/admin/revenue-data')
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users);
      setRecentAppointments(appointmentsRes.data.appointments);
      setRevenueData(revenueRes.data);
      
      // User distribution for doughnut chart
      setUserDistribution({
        labels: ['Patients', 'Doctors', 'Admins'],
        datasets: [{
          data: [statsRes.data.totalPatients, statsRes.data.totalDoctors, statsRes.data.totalAdmins || 1],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 0
        }]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      await axios.put(`/api/admin/doctors/${doctorId}/verify`);
      toast.success('Doctor verified successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error verifying doctor:', error);
      toast.error('Failed to verify doctor');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="mt-2 text-primary-100">Overview of platform activity and metrics</p>
            </div>
            <button className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center">
              <FaDownload className="mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalPatients} patients | {stats.totalDoctors} doctors
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                <p className="text-xs text-gray-500">
                  {stats.pendingAppointments} pending
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCalendarAlt className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-600">
                  ₦{stats.totalRevenue?.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <FaMoneyBillWave className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Verifications</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingDoctors}</p>
                <p className="text-xs text-gray-500">Doctors awaiting approval</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaUserMd className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
            {revenueData && (
              <Line
                data={{
                  labels: revenueData.labels,
                  datasets: [{
                    label: 'Revenue (₦)',
                    data: revenueData.values,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
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
                      }
                    }
                  }
                }}
              />
            )}
          </div>
          
          {/* User Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h2>
            {userDistribution && (
              <div className="h-64">
                <Doughnut
                  data={userDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'patient' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'doctor' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role}
                    </span>
                    {user.role === 'doctor' && !user.is_verified && (
                      <button
                        onClick={() => handleVerifyDoctor(user.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Verify Doctor"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEye />
                    </Link>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">No recent users</div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <Link to="/admin/users" className="text-primary-600 hover:text-primary-700 text-sm">
                View all users →
              </Link>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {apt.patient_name} with Dr. {apt.doctor_name}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{format(new Date(apt.appointment_date), 'MMM dd, yyyy')}</span>
                    <span>{apt.start_time}</span>
                    <span className={`${apt.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {apt.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {recentAppointments.length === 0 && (
                <div className="p-8 text-center text-gray-500">No recent appointments</div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <Link to="/admin/appointments" className="text-primary-600 hover:text-primary-700 text-sm">
                View all appointments →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/doctors"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaUserMd className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium">Manage Doctors</p>
                <p className="text-xs text-gray-500">Verify and manage doctors</p>
              </div>
            </Link>
            <Link
              to="/admin/inventory"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaPills className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium">Inventory</p>
                <p className="text-xs text-gray-500">Manage medications stock</p>
              </div>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaChartLine className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium">Reports</p>
                <p className="text-xs text-gray-500">View analytics reports</p>
              </div>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaUsers className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium">Users</p>
                <p className="text-xs text-gray-500">Manage platform users</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;