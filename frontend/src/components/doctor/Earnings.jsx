// frontend/src/components/doctor/Earnings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaDownload, 
  FaChartLine,
  FaWallet,
  FaCreditCard,
  FaHistory
} from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const Earnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    weeklyData: [],
    monthlyData: []
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchTransactions();
  }, [dateRange]);

  const fetchEarningsData = async () => {
    try {
      const response = await axios.get('/api/doctors/earnings', {
        params: { range: dateRange }
      });
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/doctors/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > earnings.pendingEarnings) {
      toast.error('Insufficient balance');
      return;
    }
    
    setWithdrawing(true);
    try {
      await axios.post('/api/doctors/withdraw', { amount: withdrawAmount });
      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchEarningsData();
      fetchTransactions();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error.response?.data?.error || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getChartData = () => {
    if (dateRange === 'month') {
      return {
        labels: earnings.weeklyData?.map(d => d.day) || [],
        datasets: [
          {
            label: 'Earnings',
            data: earnings.weeklyData?.map(d => d.amount) || [],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      };
    } else {
      return {
        labels: earnings.monthlyData?.map(d => d.month) || [],
        datasets: [
          {
            label: 'Earnings',
            data: earnings.monthlyData?.map(d => d.amount) || [],
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          }
        ]
      };
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
      <div className="bg-linear-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Earnings</h1>
              <p className="mt-2 text-green-100">Track your income and manage payouts</p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center"
            >
              <FaWallet className="mr-2" />
              Request Withdrawal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.totalEarnings)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaMoneyBillWave className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(earnings.pendingEarnings)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaWallet className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Paid Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.paidEarnings)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaCreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Month</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(earnings.thisMonthEarnings)}</p>
                <p className="text-xs text-gray-500">
                  {earnings.lastMonthEarnings > 0 && (
                    <span className={earnings.thisMonthEarnings > earnings.lastMonthEarnings ? 'text-green-600' : 'text-red-600'}>
                      {earnings.thisMonthEarnings > earnings.lastMonthEarnings ? '↑' : '↓'}
                      {Math.abs(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings * 100)).toFixed(1)}%
                    </span>
                  )} vs last month
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <FaChartLine className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          {dateRange === 'month' ? (
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
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
          ) : (
            <Bar
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
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

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaHistory className="mr-2 text-gray-500" />
              Transaction History
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.appointment_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Request Withdrawal</h2>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="font-bold text-green-600">{formatCurrency(earnings.pendingEarnings)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Minimum withdrawal: ₦10,000
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="10000"
                  max={earnings.pendingEarnings}
                />
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                <p>⚠️ Withdrawals are processed within 3-5 business days and will be sent to your registered bank account.</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || withdrawAmount < 10000 || withdrawAmount > earnings.pendingEarnings}
                  className="btn-primary"
                >
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;