// frontend/src/components/doctor/PatientHealthMonitor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaHeartbeat, 
  FaTachometerAlt, 
  FaThermometerHalf, 
  FaWeight,
  FaArrowLeft,
  FaChartLine,
  FaCalendarAlt,
  FaFileMedical,
  FaDownload
} from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PatientHealthMonitor = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vitalsData, setVitalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('bloodPressure');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, healthRes] = await Promise.all([
        axios.get(`/api/doctors/patient/${patientId}`),
        axios.get(`/api/health/patient/${patientId}`)
      ]);
      
      setPatient(patientRes.data.patient);
      setHealthRecords(healthRes.data.records);
      
      prepareChartData(healthRes.data.records);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (records) => {
    const last30Days = records.slice(-30);
    
    const chartData = {
      bloodPressure: {
        labels: last30Days.map(r => new Date(r.recorded_at).toLocaleDateString()),
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
      },
      heartRate: {
        labels: last30Days.map(r => new Date(r.recorded_at).toLocaleDateString()),
        datasets: [
          {
            label: 'Heart Rate (BPM)',
            data: last30Days.map(r => r.heart_rate),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      weight: {
        labels: last30Days.map(r => new Date(r.recorded_at).toLocaleDateString()),
        datasets: [
          {
            label: 'Weight (kg)',
            data: last30Days.map(r => r.weight_kg),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      fetalHeartRate: {
        labels: last30Days.map(r => new Date(r.recorded_at).toLocaleDateString()),
        datasets: [
          {
            label: 'Fetal Heart Rate (BPM)',
            data: last30Days.map(r => r.fetal_heart_rate),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      }
    };
    
    setVitalsData(chartData);
  };

  const getLatestVitals = () => {
    if (healthRecords.length === 0) return null;
    const latest = healthRecords[healthRecords.length - 1];
    return latest;
  };

  const getVitalStatus = (value, type) => {
    const ranges = {
      systolic: { normal: [90, 120], warning: [120, 140], critical: [140, 200] },
      diastolic: { normal: [60, 80], warning: [80, 90], critical: [90, 120] },
      heartRate: { normal: [60, 100], warning: [100, 120], critical: [120, 150] },
      temperature: { normal: [36.1, 37.2], warning: [37.2, 38], critical: [38, 40] }
    };
    
    if (!ranges[type]) return 'normal';
    
    const range = ranges[type];
    if (value < range.normal[0] || value > range.normal[1]) {
      if (value > range.critical[0] || value < range.critical[0] * 0.7) return 'critical';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const latest = getLatestVitals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-secondary-600 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/doctor/patients" className="text-white hover:text-secondary-200">
                <FaArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">
                  {patient?.first_name} {patient?.last_name}
                </h1>
                <p className="text-secondary-100">Health Monitoring Dashboard</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="bg-white text-secondary-600 px-4 py-2 rounded-lg hover:bg-secondary-50 transition-colors">
                <FaDownload className="inline mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Patient Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pregnancy Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patient?.current_pregnancy_week || 'Not recorded'}
                </p>
              </div>
              <FaHeartbeat className="h-8 w-8 text-pink-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Expected Due Date</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patient?.expected_due_date ? new Date(patient.expected_due_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <FaCalendarAlt className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Blood Group</p>
                <p className="text-2xl font-bold text-gray-900">{patient?.blood_group || 'N/A'}</p>
              </div>
              <FaFileMedical className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{healthRecords.length}</p>
              </div>
              <FaChartLine className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Latest Vitals */}
        {latest && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Vitals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus(latest.blood_pressure_systolic, 'systolic'))} mb-2`}>
                  <FaTachometerAlt className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="text-lg font-semibold">{latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus(latest.heart_rate, 'heartRate'))} mb-2`}>
                  <FaHeartbeat className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-lg font-semibold">{latest.heart_rate} BPM</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(getVitalStatus(latest.temperature, 'temperature'))} mb-2`}>
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
                    <FaHeartbeat className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-600">Fetal Heart Rate</p>
                  <p className="text-lg font-semibold">{latest.fetal_heart_rate} BPM</p>
                </div>
              )}
              
              {latest.fundal_height_cm && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                    <FaChartLine className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-600">Fundal Height</p>
                  <p className="text-lg font-semibold">{latest.fundal_height_cm} cm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        {vitalsData && (
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
              data={vitalsData[selectedMetric]}
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
                  <p className="text-sm text-gray-500">
                    {new Date(record.recorded_at).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(record.symptoms).map(([symptom, severity]) => (
                      <span key={symptom} className={`px-2 py-1 text-xs rounded-full ${
                        severity === 'severe' ? 'bg-red-100 text-red-800' :
                        severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {symptom}: {severity}
                      </span>
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
                <p>No symptom records available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHealthMonitor;