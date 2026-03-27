// frontend/src/components/admin/Reports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaDownload, 
  FaChartLine, 
  FaCalendarAlt, 
  FaUsers, 
  FaMoneyBillWave,
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaEye,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import toast from 'react-hot-toast';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [showFilters, setShowFilters] = useState(false);
  const [reportData, setReportData] = useState({
    revenue: null,
    appointments: null,
    users: null,
    pharmacy: null
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    totalUsers: 0,
    totalOrders: 0,
    platformFee: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      const [revenueRes, appointmentsRes, usersRes, pharmacyRes] = await Promise.all([
        axios.get('/api/admin/reports/revenue', { params }),
        axios.get('/api/admin/reports/appointments', { params }),
        axios.get('/api/admin/reports/users', { params }),
        axios.get('/api/admin/reports/pharmacy', { params })
      ]);
      
      setReportData({
        revenue: revenueRes.data,
        appointments: appointmentsRes.data,
        users: usersRes.data,
        pharmacy: pharmacyRes.data
      });
      
      setSummary({
        totalRevenue: revenueRes.data.total || 0,
        totalAppointments: appointmentsRes.data.total || 0,
        totalUsers: usersRes.data.total || 0,
        totalOrders: pharmacyRes.data.totalOrders || 0,
        platformFee: revenueRes.data.platformFee || 0
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/admin/reports/export/${format}`, {
        params: {
          type: reportType,
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${dateRange.start}_${dateRange.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getRevenueChartData = () => {
    if (!reportData.revenue) return null;
    return {
      labels: reportData.revenue.labels || [],
      datasets: [
        {
          label: 'Revenue (₦)',
          data: reportData.revenue.values || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const getAppointmentChartData = () => {
    if (!reportData.appointments) return null;
    return {
      labels: reportData.appointments.labels || [],
      datasets: [
        {
          label: 'Appointments',
          data: reportData.appointments.values || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const getUserDistributionData = () => {
    if (!reportData.users) return null;
    return {
      labels: ['Patients', 'Doctors', 'Admins'],
      datasets: [{
        data: [
          reportData.users.patients || 0,
          reportData.users.doctors || 0,
          reportData.users.admins || 0
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 0
      }]
    };
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
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="mt-2 text-primary-100">Generate and export platform reports</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                className="bg-white text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
              >
                <FaFilePdf className="mr-2" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="bg-white text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
              >
                <FaFileExcel className="mr-2" />
                Excel
              </button>
              <button
                onClick={handlePrint}
                className="bg-white text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₦{summary.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaMoneyBillWave className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Platform Fee</p>
                <p className="text-2xl font-bold text-yellow-600">₦{summary.platformFee.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaChartLine className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalAppointments}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaCalendarAlt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{summary.totalUsers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaUsers className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pharmacy Orders</p>
                <p className="text-2xl font-bold text-orange-600">{summary.totalOrders}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FaChartLine className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setReportType('revenue')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'revenue'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setReportType('appointments')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'appointments'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setReportType('users')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'users'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setReportType('pharmacy')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reportType === 'pharmacy'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pharmacy
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <FaFilter className="mr-2" />
              Filter
              {(dateRange.start !== format(subDays(new Date(), 30), 'yyyy-MM-dd') || 
                dateRange.end !== format(new Date(), 'yyyy-MM-dd')) && (
                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setDateRange({
                      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                      end: format(new Date(), 'yyyy-MM-dd')
                    });
                    setShowFilters(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 mr-3"
                >
                  <FaTimes className="inline mr-1" />
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn-primary text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {reportType === 'revenue' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Report</h2>
              {reportData.revenue && (
                <>
                  <Line
                    data={getRevenueChartData()}
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
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-xl font-bold text-gray-900">₦{reportData.revenue.total?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Platform Fee (10%)</p>
                      <p className="text-xl font-bold text-yellow-600">₦{reportData.revenue.platformFee?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Doctor Earnings</p>
                      <p className="text-xl font-bold text-green-600">₦{reportData.revenue.doctorEarnings?.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {reportType === 'appointments' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments Report</h2>
              {reportData.appointments && (
                <>
                  <Line
                    data={getAppointmentChartData()}
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.parsed.y} appointments`
                          }
                        }
                      }
                    }}
                  />
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Appointments</p>
                      <p className="text-xl font-bold text-gray-900">{reportData.appointments.total}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-xl font-bold text-green-600">{reportData.appointments.completed}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Cancelled</p>
                      <p className="text-xl font-bold text-red-600">{reportData.appointments.cancelled}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">No-Show</p>
                      <p className="text-xl font-bold text-orange-600">{reportData.appointments.noShow}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Appointment Type Distribution</h3>
                    <div className="h-64">
                      <Doughnut
                        data={{
                          labels: ['Video Consultations', 'In-Person Visits'],
                          datasets: [{
                            data: [
                              reportData.appointments.video || 0,
                              reportData.appointments.inPerson || 0
                            ],
                            backgroundColor: ['#3b82f6', '#10b981']
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {reportType === 'users' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Report</h2>
              {reportData.users && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                      <FaUsers className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Patients</p>
                      <p className="text-2xl font-bold text-blue-600">{reportData.users.patients}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6 text-center">
                      <FaUsers className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Doctors</p>
                      <p className="text-2xl font-bold text-green-600">{reportData.users.doctors}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-6 text-center">
                      <FaUsers className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">New Users</p>
                      <p className="text-2xl font-bold text-purple-600">{reportData.users.newUsers}</p>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <Doughnut
                      data={getUserDistributionData()}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">User Growth</h3>
                    <Line
                      data={{
                        labels: reportData.users.growthLabels || [],
                        datasets: [
                          {
                            label: 'Patients',
                            data: reportData.users.patientGrowth || [],
                            borderColor: 'rgb(59, 130, 246)',
                            tension: 0.4
                          },
                          {
                            label: 'Doctors',
                            data: reportData.users.doctorGrowth || [],
                            borderColor: 'rgb(34, 197, 94)',
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{ responsive: true }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {reportType === 'pharmacy' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pharmacy Report</h2>
              {reportData.pharmacy && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900">{reportData.pharmacy.totalOrders}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Prescription Orders</p>
                      <p className="text-xl font-bold text-purple-600">{reportData.pharmacy.prescriptionOrders}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">OTC Orders</p>
                      <p className="text-xl font-bold text-green-600">{reportData.pharmacy.otcOrders}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="text-xl font-bold text-primary-600">₦{reportData.pharmacy.revenue?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Top Selling Medications</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-xs font-medium text-gray-500">Medication</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500">Units Sold</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.pharmacy.topMedications?.map((med, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2">{med.name}</td>
                              <td className="py-2">{med.units_sold}</td>
                              <td className="py-2">₦{med.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;