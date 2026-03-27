// frontend/src/components/patient/Pharmacy.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FaSearch, FaShoppingCart, FaPrescription, FaPills, FaPlus, FaMinus, FaTrash, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Pharmacy = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchMedications();
    fetchPrescriptions();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('pharmacyCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Filter medications based on search and category
    let filtered = medications;
    
    if (searchTerm) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(med => med.category === category);
    }
    
    setFilteredMeds(filtered);
  }, [searchTerm, category, medications]);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('pharmacyCart', JSON.stringify(cart));
  }, [cart]);

  const fetchMedications = async () => {
    try {
      const response = await axios.get('/api/pharmacy/medications');
      setMedications(response.data.medications);
      setFilteredMeds(response.data.medications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/pharmacy/prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const addToCart = (medication) => {
    const existingItem = cart.find(item => item.id === medication.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === medication.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...medication, quantity: 1 }]);
    }
    
    toast.success(`${medication.name} added to cart`);
  };

  const updateQuantity = (medicationId, change) => {
    setCart(cart.map(item => {
      if (item.id === medicationId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (medicationId) => {
    setCart(cart.filter(item => item.id !== medicationId));
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // Check if any items require prescription
      const prescriptionRequired = cart.some(item => item.requires_prescription);
      
      let prescriptionId = null;
      if (prescriptionRequired && !selectedPrescription) {
        toast.error('Some items require a prescription. Please select a prescription.');
        setCheckoutLoading(false);
        return;
      }
      
      if (prescriptionRequired && selectedPrescription) {
        prescriptionId = selectedPrescription.id;
      }
      
      const orderData = {
        items: cart.map(item => ({
          medicationId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotal(),
        prescriptionId,
        orderType: prescriptionRequired ? 'prescription' : 'over_the_counter',
        deliveryAddress: user?.profile?.address || ''
      };
      
      const response = await axios.post('/api/pharmacy/checkout', orderData);
      
      // Redirect to payment
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        toast.success('Order placed successfully!');
        setCart([]);
        setShowCart(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to process order');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Medications' },
    { value: 'Vitamins', label: 'Vitamins & Supplements' },
    { value: 'Minerals', label: 'Minerals' },
    { value: 'Pain Relief', label: 'Pain Relief' },
    { value: 'Digestive', label: 'Digestive Health' },
    { value: 'Prescription', label: 'Prescription Only' }
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
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pharmacy</h1>
              <p className="mt-2 text-primary-100">Order medications and supplements</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <FaShoppingCart className="inline mr-2" />
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            {prescriptions.length > 0 && (
              <div>
                <select
                  value={selectedPrescription?.id || ''}
                  onChange={(e) => {
                    const presc = prescriptions.find(p => p.id === e.target.value);
                    setSelectedPrescription(presc);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Prescription (Optional)</option>
                  {prescriptions.map(presc => (
                    <option key={presc.id} value={presc.id}>
                      Prescription from {new Date(presc.issued_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Medications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMeds.map((med) => (
            <div key={med.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{med.name}</h3>
                    {med.generic_name && (
                      <p className="text-sm text-gray-500">{med.generic_name}</p>
                    )}
                  </div>
                  {med.requires_prescription && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Rx Required
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{med.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">₦{med.price}</p>
                    <p className="text-xs text-gray-500">per {med.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">In Stock: {med.stock_quantity}</p>
                    {med.manufacturer && (
                      <p className="text-xs text-gray-400">{med.manufacturer}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => addToCart(med)}
                  disabled={med.stock_quantity === 0}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    med.stock_quantity > 0
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {med.stock_quantity > 0 ? (
                    <>
                      <FaShoppingCart className="inline mr-2" />
                      Add to Cart
                    </>
                  ) : (
                    'Out of Stock'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMeds.length === 0 && (
          <div className="text-center py-12">
            <FaPills className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No medications found</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <FaShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">₦{item.price} per {item.unit}</p>
                        {item.requires_prescription && (
                          <p className="text-xs text-red-600 mt-1">Prescription required</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FaMinus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FaPlus className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded-full hover:bg-red-100 ml-2"
                        >
                          <FaTrash className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">₦{calculateTotal().toLocaleString()}</span>
                </div>
                
                {selectedPrescription && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Prescription applied - {selectedPrescription.notes || 'Valid prescription'}
                      </span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full btn-primary py-3 text-lg"
                >
                  {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;