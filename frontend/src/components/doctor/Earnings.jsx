// frontend/src/components/doctor/Earnings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaDownload, 
  FaChartLine,
  FaWallet,
  FaCreditCard,
  FaHistory,
  FaArrowRight,
  FaBank,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import toast from 'react-hot-toast';

const Earnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    weeklyData: [],
    monthlyData: [],
    yearlyData: []
  });
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchTransactions();
    fetchWithdrawals();
    fetchBankDetails();
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
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await axios.get('/api/doctors/withdrawals');
      setWithdrawals(response.data.withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await axios.get('/api/doctors/bank-details');
      if (response.data.bankDetails) {
        setBankDetails(response.data.bankDetails);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.bank_name || !bankDetails.account_number || !bankDetails.account_name) {
      toast.error('Please fill in all bank details');
      return;
    }
    
    setSavingBank(true);
    try {
      await axios.post('/api/doctors/bank-details', bankDetails);
      toast.success('Bank details saved successfully');
      setShowBankModal(false);
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount < 10000) {
      toast.error('Minimum withdrawal amount is ₦10,000');
      return;
    }
    
    if (withdrawAmount > earnings.pendingEarnings) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (!bankDetails.account_number) {
      toast.error('Please add your bank details first');
      setShowBankModal(true);
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
      fetchWithdrawals();
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
            tension: 0.4,
            pointBackgroundColor: 'rgb(34, 197, 94)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      };
    } else if (dateRange === 'year') {
      return {
        labels: earnings.monthlyData?.map(d => d.month) || [],
        datasets: [
          {
            label: 'Earnings',
            data: earnings.monthlyData?.map(d => d.amount) || [],
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            borderRadius: 8
          }
        ]
      };
    } else {
      return {
        labels: earnings.yearlyData?.map(d => d.year) || [],
        datasets: [
          {
            label: 'Earnings',
            data: earnings.yearlyData?.map(d => d.amount) || [],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      };
    }
  };

  const getWithdrawalStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
              <p className="mt-2 text-green-100">Track your income and manage payouts</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBankModal(true)}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center"
              >
                <FaBank className="mr-2" />
                {bankDetails.account_number ? 'Update Bank Details' : 'Add Bank Details'}
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center border border-green-400"
              >
                <FaWallet className="mr-2" />
                Request Withdrawal
              </button>
            </div>
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
                <p className="text-xs text-green-600 mt-1">Lifetime earnings</p>
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
                <p className="text-xs text-gray-500 mt-1">Available for withdrawal</p>
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
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(earnings.paidEarnings)}</p>
                <p className="text-xs text-gray-500 mt-1">Already withdrawn</p>
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
                <p className="text-xs text-gray-500 mt-1">
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

        {/* Bank Details Summary */}
        {bankDetails.account_number && (
          <div className="bg-blue-50 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaBank className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Bank Account</p>
                <p className="text-xs text-blue-600">
                  {bankDetails.bank_name} - {bankDetails.account_number} ({bankDetails.account_name})
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBankModal(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Update
            </button>
          </div>
        )}

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
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${formatCurrency(context.parsed.y)}`
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => formatCurrency(value)
                    }
                  }
                }
              }}
            />
          ) : dateRange === 'year' ? (
            <Bar
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${formatCurrency(context.parsed.y)}`
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => formatCurrency(value)
                    }
                  }
                }
              }}
            />
          ) : (
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${formatCurrency(context.parsed.y)}`
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => formatCurrency(value)
                    }
                  }
                }
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaHistory className="mr-2 text-gray-500" />
                Recent Transactions
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </p>
                      <p className={`text-xs ${
                        transaction.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaWallet className="mr-2 text-gray-500" />
                Withdrawal History
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {withdrawals.slice(0, 10).map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Withdrawal to {withdrawal.bank_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(withdrawal.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        -{formatCurrency(withdrawal.amount)}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getWithdrawalStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                  {withdrawal.status === 'processing' && (
                    <div className="mt-2 text-xs text-yellow-600 flex items-center">
                      <FaSpinner className="animate-spin mr-1" />
                      Processing - usually takes 3-5 business days
                    </div>
                  )}
                  {withdrawal.status === 'completed' && withdrawal.reference && (
                    <div className="mt-2 text-xs text-gray-500">
                      Ref: {withdrawal.reference}
                    </div>
                  )}
                </div>
              ))}
              {withdrawals.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No withdrawal requests yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <FaInfoCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">About Earnings</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your earnings are calculated as consultation fee minus 10% platform fee. 
                Withdrawals are processed within 3-5 business days and sent to your registered bank account.
                Minimum withdrawal amount is ₦10,000.
              </p>
              <div className="mt-3 flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Confirmed appointments</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Pending payment</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Paid to bank</span>
                </div>
              </div>
            </div>
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
              
              {bankDetails.account_number && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-800">Will be sent to:</p>
                  <p className="text-blue-700 mt-1">
                    {bankDetails.bank_name} - {bankDetails.account_number}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">{bankDetails.account_name}</p>
                </div>
              )}
              
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

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Bank Account Details</h2>
                <button
                  onClick={() => setShowBankModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <select
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Bank</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="First Bank">First Bank</option>
                  <option value="GTBank">GTBank</option>
                  <option value="UBA">UBA</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="Stanbic IBTC">Stanbic IBTC</option>
                  <option value="Fidelity Bank">Fidelity Bank</option>
                  <option value="Union Bank">Union Bank</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="input-field"
                  placeholder="10-digit account number"
                  maxLength="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={bankDetails.account_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                  className="input-field"
                  placeholder="Account holder name"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p>💡 Your withdrawal requests will be sent to this bank account. Please ensure the details are correct.</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowBankModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBankDetails}
                  disabled={savingBank}
                  className="btn-primary"
                >
                  {savingBank ? 'Saving...' : 'Save Bank Details'}
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