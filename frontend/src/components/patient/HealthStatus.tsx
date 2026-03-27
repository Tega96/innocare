// frontend/src/components/patient/HealthStatus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaHeartbeat, 
  FaTachometerAlt, 
  FaThermometerHalf, 
  FaWeight, 
  FaRuler,
  FaBaby,
  FaSave,
  FaChartLine,
  FaPlus,
  FaCalendarAlt
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
  Legend,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HealthStatus = () => {
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('bloodPressure');
  
  const [formData, setFormData] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight_kg: '',
    height_cm: '',
    fundal_height_cm: '',
    fetal_heart_rate: '',
    fetal_movements_per_day: '',
    symptoms: {
      nausea: 'none',
      headache: 'none',
      fatigue: 'none',
      swelling: 'none',
      cramps: 'none',
      back_pain: 'none'
    },
    notes: ''
  });

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const response = await axios.get('/api/health/records');
      setHealthRecords(response.data.records);
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast.error('Failed to load health records');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSymptomChange = (symptom, severity) => {
    setFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptom]: severity
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post('/api/health/record', formData);
      toast.success('Health record saved successfully!');
      setShowForm(false);
      fetchHealthRecords();
      resetForm();
    } catch (error) {
      console.error('Error saving health record:', error);
      toast.error('Failed to save health record');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      weight_kg: '',
      height_cm: '',
      fundal_height_cm: '',
      fetal_heart_rate: '',
      fetal_movements_per_day: '',
      symptoms: {
        nausea: 'none',
        headache: 'none',
        fatigue: 'none',
        swelling: 'none',
        cramps: 'none',
        back_pain: 'none'
      },
      notes: ''
    });
  };

  const getLatestRecord = () => {
    if (healthRecords.length === 0) return null;
    return healthRecords[healthRecords.length - 1];
  };

  const getTrendData = (metric) => {
    const last30Days = healthRecords.slice(-30);
    const labels = last30Days.map(r => new Date(r.recorded_at).toLocaleDateString());
    
    let data = [];
    switch(metric) {
      case 'bloodPressure':
        data = {
          labels,
          datasets: [
            {
              label: 'Systolic',
              data: last30Days.map(r => r.blood_pressure_systolic),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Diastolic',
              data: last30Days.map(r => r.blood_pressure_diastolic),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        };
        break;
      case 'heartRate':
        data = {
          labels,
          datasets: [{
            label: 'Heart Rate (BPM)',
            data: last30Days.map(r => r.heart_rate),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
        break;
      case 'weight':
        data = {
          labels,
          datasets: [{
            label: 'Weight (kg)',
            data: last30Days.map(r => r.weight_kg),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
        break;
      case 'fetalHeartRate':
        data = {
          labels,
          datasets: [{
            label: 'Fetal Heart Rate (BPM)',
            data: last30Days.map(r => r.fetal_heart_rate),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
        break;
      default:
        data = { labels: [], datasets: [] };
    }
    
    return data;
  };

  const getVitalStatus = (value, type, currentValue) => {
    if (!currentValue) return 'normal';
    
    const ranges = {
      systolic: { normal: [90, 120], warning: [120, 140], critical: [140, 200] },
      diastolic: { normal: [60, 80], warning: [80, 90], critical: [90, 120] },
      heartRate: { normal: [60, 100], warning: [100, 120], critical: [120, 150] },
      temperature: { normal: [36.1, 37.2], warning: [37.2, 38], critical: [38, 40] }
    };
    
    if (!ranges[type]) return 'normal';
    
    const range = ranges[type];
    if (currentValue < range.normal[0] || currentValue > range.normal[1]) {
      if (currentValue > range.critical[0] || currentValue < range.critical[0] * 0.7) return 'critical';
      return 'warning';
    }
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const latest = getLatestRecord();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Health Status</h1>
              <p className="mt-2 text-primary-100">Track your vitals and pregnancy progress</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Log Health Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Latest Vitals */}
        {latest && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Vitals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus('systolic', 'systolic', latest.blood_pressure_systolic))} mb-2`}>
                  <FaTachometerAlt className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="text-lg font-semibold">
                  {latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(latest.recorded_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus('heartRate', 'heartRate', latest.heart_rate))} mb-2`}>
                  <FaHeartbeat className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-lg font-semibold">{latest.heart_rate} BPM</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus('temperature', 'temperature', latest.temperature))} mb-2`}>
                  <FaThermometerHalf className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-lg font-semibold">{latest.temperature}°C</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <FaWeight className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="text-lg font-semibold">{latest.weight_kg} kg</p>
              </div>
              
              {latest.fetal_heart_rate && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                    <FaBaby className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-600">Fetal Heart Rate</p>
                  <p className="text-lg font-semibold">{latest.fetal_heart_rate} BPM</p>
                </div>
              )}
              
              {latest.fundal_height_cm && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                    <FaRuler className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-600">Fundal Height</p>
                  <p className="text-lg font-semibold">{latest.fundal_height_cm} cm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Trends Chart */}
        {healthRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Health Trends</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                <option value="bloodPressure">Blood Pressure</option>
                <option value="heartRate">Heart Rate</option>
                <option value="weight">Weight</option>
                <option value="fetalHeartRate">Fetal Heart Rate</option>
              </select>
            </div>
            <Line
              data={getTrendData(selectedMetric)}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false
                  }
                }
              }}
            />
          </div>
        )}

        {/* Symptoms Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptoms Timeline</h2>
          <div className="space-y-4">
            {healthRecords.slice(-10).reverse().map((record, index) => (
              record.symptoms && Object.keys(record.symptoms).length > 0 && (
                <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">
                      <FaCalendarAlt className="inline mr-1" size={12} />
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(record.symptoms).map(([symptom, severity]) => (
                      severity !== 'none' && (
                        <span key={symptom} className={`px-2 py-1 text-xs rounded-full ${
                          severity === 'severe' ? 'bg-red-100 text-red-800' :
                          severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {symptom.replace('_', ' ')}: {severity}
                        </span>
                      )
                    ))}
                  </div>
                  {record.notes && (
                    <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                  )}
                </div>
              )
            ))}
            
            {healthRecords.filter(r => r.symptoms && Object.keys(r.symptoms).length > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaChartLine className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No symptom records available</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-primary-600 mt-2 inline-block"
                >
                  Log your first health record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Log Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Log Health Data</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure (Systolic)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure (Diastolic)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 80"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 75"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 36.6"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 65.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 165"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fundal Height (cm)
                  </label>
                  <input
                    type="number"
                    name="fundal_height_cm"
                    value={formData.fundal_height_cm}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 28"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fetal Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    name="fetal_heart_rate"
                    value={formData.fetal_heart_rate}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 140"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fetal Movements (per day)
                  </label>
                  <input
                    type="number"
                    name="fetal_movements_per_day"
                    value={formData.fetal_movements_per_day}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Symptoms (Rate each)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.symptoms).map(([symptom, severity]) => (
                    <div key={symptom}>
                      <label className="block text-sm text-gray-700 mb-1 capitalize">
                        {symptom.replace('_', ' ')}
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => handleSymptomChange(symptom, e.target.value)}
                        className="input-field"
                      >
                        <option value="none">None</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="input-field"
                  placeholder="Any additional comments about how you're feeling..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Health Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthStatus;