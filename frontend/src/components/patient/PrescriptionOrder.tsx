// frontend/src/components/patient/PrescriptionOrder.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FaPrescription, 
  FaPills, 
  FaCalendarAlt, 
  FaUserMd,
  FaShoppingCart,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaEye,
  FaArrowRight
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PrescriptionOrder = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
    fetchUserAddress();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/pharmacy/prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = async () => {
    try {
      const response = await axios.get('/api/patients/profile');
      if (response.data.address) {
        setDeliveryAddress(response.data.address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleOrderPrescription = async (prescription) => {
    if (!deliveryAddress) {
      toast.error('Please add your delivery address');
      return;
    }
    
    setSelectedPrescription(prescription);
    setShowOrderModal(true);
  };

  const confirmOrder = async () => {
    if (!selectedPrescription) return;
    
    setOrdering(true);
    try {
      const orderData = {
        prescriptionId: selectedPrescription.id,
        deliveryAddress,
        items: selectedPrescription.items.map(item => ({
          medicationId: item.medication_id,
          quantity: item.quantity,
          price: item.medication_price
        }))
      };
      
      const response = await axios.post('/api/pharmacy/order-prescription', orderData);
      
      toast.success('Prescription order placed successfully!');
      setShowOrderModal(false);
      
      // Redirect to payment if needed
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
      
      fetchPrescriptions();
    } catch (error) {
      console.error('Error ordering prescription:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      dispensed: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Active',
      dispensed: 'Dispensed',
      expired: 'Expired',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.medication_price * item.quantity), 0);
  };

  const handleDownloadPrescription = async (prescription) => {
    try {
      const response = await axios.get(`/api/pharmacy/prescriptions/${prescription.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${prescription.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Prescription downloaded');
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Failed to download prescription');
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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold">Prescription Orders</h1>
            <p className="mt-2 text-purple-100">Order medications from your prescriptions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Active Prescriptions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Prescriptions</h2>
          <div className="grid grid-cols-1 gap-6">
            {prescriptions.filter(p => p.status === 'active').map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <FaPrescription className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Prescription from {format(new Date(prescription.issued_date), 'MMMM dd, yyyy')}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(prescription.status)}`}>
                          {getStatusText(prescription.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Prescribed by: Dr. {prescription.doctor_name}
                      </p>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                        <div className="space-y-2">
                          {prescription.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-800">{item.medication_name}</p>
                                <p className="text-xs text-gray-500">
                                  {item.dosage} - {item.frequency} for {item.duration_days} days
                                </p>
                                {item.instructions && (
                                  <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">₦{item.medication_price}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Expires on:</p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(prescription.expiry_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Amount:</p>
                          <p className="text-xl font-bold text-primary-600">
                            ₦{calculateTotal(prescription.items).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleOrderPrescription(prescription)}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      >
                        <FaShoppingCart className="mr-2" />
                        Order Now
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setShowDetails(true);
                        }}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <FaEye className="mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownloadPrescription(prescription)}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <FaDownload className="mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {prescriptions.filter(p => p.status === 'active').length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FaPrescription className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Prescriptions</h3>
                <p className="text-gray-500">
                  Your active prescriptions will appear here. Consult with a doctor to get a prescription.
                </p>
                <Link
                  to="/patient/search-doctors"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Find a Doctor →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Expired Prescriptions */}
        {prescriptions.filter(p => p.status === 'expired').length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expired Prescriptions</h2>
            <div className="grid grid-cols-1 gap-4">
              {prescriptions.filter(p => p.status === 'expired').map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-xl shadow-md p-6 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FaPrescription className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700">
                          Prescription from {format(new Date(prescription.issued_date), 'MMMM dd, yyyy')}
                        </h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Prescribed by: Dr. {prescription.doctor_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Expired on: {format(new Date(prescription.expiry_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPrescription(prescription);
                        setShowDetails(true);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Confirmation Modal */}
      {showOrderModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Order Prescription</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                <div className="space-y-2">
                  {selectedPrescription.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.medication_name} x {item.quantity}</span>
                      <span>₦{(item.medication_price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-primary-600">₦{calculateTotal(selectedPrescription.items).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows="3"
                  className="input-field"
                  placeholder="Enter your delivery address"
                  required
                />
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                <p>⚠️ Please ensure your delivery address is correct. Orders will be delivered within 2-3 business days.</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={ordering || !deliveryAddress}
                  className="btn-primary"
                >
                  {ordering ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Details Modal */}
      {showDetails && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Prescribed By</p>
                  <p className="font-medium">Dr. {selectedPrescription.doctor_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issued Date</p>
                  <p className="font-medium">{format(new Date(selectedPrescription.issued_date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">{format(new Date(selectedPrescription.expiry_date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedPrescription.status)}`}>
                    {getStatusText(selectedPrescription.status)}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Medications</h3>
                <div className="space-y-3">
                  {selectedPrescription.items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.medication_name}</p>
                          <p className="text-sm text-gray-600">{item.dosage}</p>
                          <p className="text-sm text-gray-600">Take {item.frequency}</p>
                          <p className="text-sm text-gray-600">Duration: {item.duration_days} days</p>
                          {item.instructions && (
                            <p className="text-sm text-gray-500 mt-1">Instructions: {item.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm font-medium text-primary-600">₦{item.medication_price} each</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPrescription.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Doctor's Notes</h3>
                  <p className="text-gray-600">{selectedPrescription.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-primary-600">
                      ₦{calculateTotal(selectedPrescription.items).toLocaleString()}
                    </p>
                  </div>
                  {selectedPrescription.status === 'active' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleOrderPrescription(selectedPrescription);
                      }}
                      className="btn-primary flex items-center"
                    >
                      <FaShoppingCart className="mr-2" />
                      Order Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionOrder;