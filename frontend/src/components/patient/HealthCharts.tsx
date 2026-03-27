// frontend/src/components/patient/HealthCharts.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaHeartbeat, 
  FaTachometerAlt, 
  FaWeight, 
  FaBaby,
  FaChartLine,
  FaCalendarAlt,
  FaDownload,
  FaPrint,
  FaInfoCircle,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, subDays, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HealthCharts = () => {
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('bloodPressure');
  const [showInsights, setShowInsights] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    fetchHealthRecords();
  }, [dateRange]);

  const fetchHealthRecords = async () => {
    try {
      let params = {};
      const now = new Date();
      
      switch(dateRange) {
        case 'week':
          params = {
            start_date: format(startOfWeek(now), 'yyyy-MM-dd'),
            end_date: format(now, 'yyyy-MM-dd')
          };
          break;
        case 'month':
          params = {
            start_date: format(subDays(now, 30), 'yyyy-MM-dd'),
            end_date: format(now, 'yyyy-MM-dd')
          };
          break;
        case 'threeMonths':
          params = {
            start_date: format(subMonths(now, 3), 'yyyy-MM-dd'),
            end_date: format(now, 'yyyy-MM-dd')
          };
          break;
        case 'sixMonths':
          params = {
            start_date: format(subMonths(now, 6), 'yyyy-MM-dd'),
            end_date: format(now, 'yyyy-MM-dd')
          };
          break;
      }
      
      const response = await axios.get('/api/health/records', { params });
      setHealthRecords(response.data.records);
      
      // Calculate comparison data for insights
      calculateComparisonData(response.data.records);
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const calculateComparisonData = (records) => {
    if (records.length < 2) return;
    
    const latest = records[records.length - 1];
    const previous = records[records.length - 2];
    
    setComparisonData({
      bloodPressure: {
        systolic: {
          current: latest.blood_pressure_systolic,
          previous: previous.blood_pressure_systolic,
          change: ((latest.blood_pressure_systolic - previous.blood_pressure_systolic) / previous.blood_pressure_systolic) * 100
        },
        diastolic: {
          current: latest.blood_pressure_diastolic,
          previous: previous.blood_pressure_diastolic,
          change: ((latest.blood_pressure_diastolic - previous.blood_pressure_diastolic) / previous.blood_pressure_diastolic) * 100
        }
      },
      heartRate: {
        current: latest.heart_rate,
        previous: previous.heart_rate,
        change: ((latest.heart_rate - previous.heart_rate) / previous.heart_rate) * 100
      },
      weight: {
        current: latest.weight_kg,
        previous: previous.weight_kg,
        change: ((latest.weight_kg - previous.weight_kg) / previous.weight_kg) * 100
      },
      fetalHeartRate: latest.fetal_heart_rate ? {
        current: latest.fetal_heart_rate,
        previous: previous.fetal_heart_rate,
        change: ((latest.fetal_heart_rate - previous.fetal_heart_rate) / previous.fetal_heart_rate) * 100
      } : null
    });
  };

  const getBloodPressureData = () => {
    const labels = healthRecords.map(r => format(new Date(r.recorded_at), 'MMM dd'));
    const systolicData = healthRecords.map(r => r.blood_pressure_systolic);
    const diastolicData = healthRecords.map(r => r.blood_pressure_diastolic);
    
    return {
      labels,
      datasets: [
        {
          label: 'Systolic (Top Number)',
          data: systolicData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Diastolic (Bottom Number)',
          data: diastolicData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  };

  const getHeartRateData = () => {
    const labels = healthRecords.map(r => format(new Date(r.recorded_at), 'MMM dd'));
    const data = healthRecords.map(r => r.heart_rate);
    
    return {
      labels,
      datasets: [
        {
          label: 'Heart Rate (BPM)',
          data,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  };

  const getWeightData = () => {
    const labels = healthRecords.map(r => format(new Date(r.recorded_at), 'MMM dd'));
    const data = healthRecords.map(r => r.weight_kg);
    
    return {
      labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data,
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
  };

  const getFetalHeartRateData = () => {
    const recordsWithFetal = healthRecords.filter(r => r.fetal_heart_rate);
    const labels = recordsWithFetal.map(r => format(new Date(r.recorded_at), 'MMM dd'));
    const data = recordsWithFetal.map(r => r.fetal_heart_rate);
    
    return {
      labels,
      datasets: [
        {
          label: 'Fetal Heart Rate (BPM)',
          data,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  };

  const getSymptomRadarData = () => {
    const latestRecord = healthRecords[healthRecords.length - 1];
    if (!latestRecord?.symptoms) return null;
    
    const symptoms = latestRecord.symptoms;
    const symptomNames = Object.keys(symptoms).filter(s => symptoms[s] !== 'none');
    const severityValues = symptomNames.map(s => {
      const severity = symptoms[s];
      switch(severity) {
        case 'mild': return 1;
        case 'moderate': return 2;
        case 'severe': return 3;
        default: return 0;
      }
    });
    
    return {
      labels: symptomNames.map(s => s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: 'Symptom Severity',
          data: severityValues,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  };

  const getNormalRanges = () => {
    return {
      bloodPressure: {
        systolic: { min: 90, max: 120, optimal: 110 },
        diastolic: { min: 60, max: 80, optimal: 70 }
      },
      heartRate: { min: 60, max: 100, optimal: 75 },
      temperature: { min: 36.1, max: 37.2, optimal: 36.6 },
      fetalHeartRate: { min: 110, max: 160, optimal: 140 }
    };
  };

  const getHealthScore = () => {
    if (healthRecords.length === 0) return 0;
    
    const latest = healthRecords[healthRecords.length - 1];
    const ranges = getNormalRanges();
    let score = 100;
    
    // Blood pressure score
    if (latest.blood_pressure_systolic) {
      if (latest.blood_pressure_systolic > ranges.bloodPressure.systolic.max) {
        score -= Math.min(20, (latest.blood_pressure_systolic - ranges.bloodPressure.systolic.max) / 2);
      } else if (latest.blood_pressure_systolic < ranges.bloodPressure.systolic.min) {
        score -= Math.min(20, (ranges.bloodPressure.systolic.min - latest.blood_pressure_systolic) / 2);
      }
    }
    
    // Heart rate score
    if (latest.heart_rate) {
      if (latest.heart_rate > ranges.heartRate.max) {
        score -= Math.min(20, (latest.heart_rate - ranges.heartRate.max) / 2);
      } else if (latest.heart_rate < ranges.heartRate.min) {
        score -= Math.min(20, (ranges.heartRate.min - latest.heart_rate) / 2);
      }
    }
    
    // Fetal heart rate score
    if (latest.fetal_heart_rate && ranges.fetalHeartRate) {
      if (latest.fetal_heart_rate > ranges.fetalHeartRate.max) {
        score -= Math.min(15, (latest.fetal_heart_rate - ranges.fetalHeartRate.max) / 3);
      } else if (latest.fetal_heart_rate < ranges.fetalHeartRate.min) {
        score -= Math.min(15, (ranges.fetalHeartRate.min - latest.fetal_heart_rate) / 3);
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExport = () => {
    // Export chart as image
    const chartCanvas = document.getElementById('health-chart');
    if (chartCanvas) {
      const link = document.createElement('a');
      link.download = `health_chart_${selectedMetric}_${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = chartCanvas.toDataURL();
      link.click();
      toast.success('Chart exported successfully');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const healthScore = getHealthScore();
  const symptomRadarData = getSymptomRadarData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Health Analytics</h1>
              <p className="mt-2 text-primary-100">Track your health trends and insights</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={handleExport}
                className="bg-white text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
              >
                <FaDownload className="mr-2" />
                Export
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
        {/* Health Score Card */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overall Health Score</h2>
              <p className="text-sm text-gray-600">Based on your recent vitals</p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getHealthScoreColor(healthScore)}`}>
                {Math.round(healthScore)}/100
              </div>
              <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
            <div className="flex space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="threeMonths">Last 3 Months</option>
                <option value="sixMonths">Last 6 Months</option>
              </select>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
              >
                <FaInfoCircle className="mr-1" />
                {showInsights ? 'Hide Insights' : 'Show Insights'}
              </button>
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMetric('bloodPressure')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                selectedMetric === 'bloodPressure'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaTachometerAlt className="mr-2" />
              Blood Pressure
            </button>
            <button
              onClick={() => setSelectedMetric('heartRate')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                selectedMetric === 'heartRate'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaHeartbeat className="mr-2" />
              Heart Rate
            </button>
            <button
              onClick={() => setSelectedMetric('weight')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                selectedMetric === 'weight'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaWeight className="mr-2" />
              Weight
            </button>
            <button
              onClick={() => setSelectedMetric('fetalHeartRate')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                selectedMetric === 'fetalHeartRate'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaBaby className="mr-2" />
              Fetal Heart Rate
            </button>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
            {selectedMetric === 'bloodPressure' ? 'Blood Pressure Trend' :
             selectedMetric === 'heartRate' ? 'Heart Rate Trend' :
             selectedMetric === 'weight' ? 'Weight Trend' :
             'Fetal Heart Rate Trend'}
          </h2>
          <div className="h-96">
            <Line
              id="health-chart"
              data={
                selectedMetric === 'bloodPressure' ? getBloodPressureData() :
                selectedMetric === 'heartRate' ? getHeartRateData() :
                selectedMetric === 'weight' ? getWeightData() :
                getFetalHeartRateData()
              }
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        label += context.parsed.y;
                        if (selectedMetric === 'bloodPressure') label += ' mmHg';
                        if (selectedMetric === 'heartRate') label += ' BPM';
                        if (selectedMetric === 'weight') label += ' kg';
                        if (selectedMetric === 'fetalHeartRate') label += ' BPM';
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
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
          </div>
        </div>

        {/* Insights and Comparison */}
        {showInsights && comparisonData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Comparison Cards */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest vs Previous</h2>
              <div className="space-y-4">
                {comparisonData.bloodPressure && (
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Blood Pressure</span>
                      <span className="font-medium">
                        {comparisonData.bloodPressure.systolic.current}/{comparisonData.bloodPressure.diastolic.current} mmHg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Previous: {comparisonData.bloodPressure.systolic.previous}/{comparisonData.bloodPressure.diastolic.previous} mmHg</span>
                      <span className={comparisonData.bloodPressure.systolic.change > 0 ? 'text-red-600' : 'text-green-600'}>
                        {comparisonData.bloodPressure.systolic.change > 0 ? '↑' : '↓'} {Math.abs(comparisonData.bloodPressure.systolic.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {comparisonData.heartRate && (
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Heart Rate</span>
                      <span className="font-medium">{comparisonData.heartRate.current} BPM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Previous: {comparisonData.heartRate.previous} BPM</span>
                      <span className={comparisonData.heartRate.change > 0 ? 'text-red-600' : 'text-green-600'}>
                        {comparisonData.heartRate.change > 0 ? '↑' : '↓'} {Math.abs(comparisonData.heartRate.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {comparisonData.weight && (
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Weight</span>
                      <span className="font-medium">{comparisonData.weight.current} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Previous: {comparisonData.weight.previous} kg</span>
                      <span className={comparisonData.weight.change > 0 ? 'text-yellow-600' : 'text-green-600'}>
                        {comparisonData.weight.change > 0 ? '↑' : '↓'} {Math.abs(comparisonData.weight.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {comparisonData.fetalHeartRate && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Fetal Heart Rate</span>
                      <span className="font-medium">{comparisonData.fetalHeartRate.current} BPM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Previous: {comparisonData.fetalHeartRate.previous} BPM</span>
                      <span className={comparisonData.fetalHeartRate.change > 0 ? 'text-purple-600' : 'text-green-600'}>
                        {comparisonData.fetalHeartRate.change > 0 ? '↑' : '↓'} {Math.abs(comparisonData.fetalHeartRate.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Symptom Radar Chart */}
            {symptomRadarData && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptom Severity</h2>
                <div className="h-80">
                  <Radar
                    data={symptomRadarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          min: 0,
                          max: 3,
                          ticks: {
                            stepSize: 1,
                            callback: (value) => {
                              if (value === 0) return 'None';
                              if (value === 1) return 'Mild';
                              if (value === 2) return 'Moderate';
                              if (value === 3) return 'Severe';
                              return value;
                            }
                          }
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const severity = context.raw;
                              if (severity === 0) return 'None';
                              if (severity === 1) return 'Mild';
                              if (severity === 2) return 'Moderate';
                              if (severity === 3) return 'Severe';
                              return severity;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Normal Ranges Reference */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Normal Ranges Reference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Blood Pressure</h3>
              <p className="text-sm text-gray-600">Systolic: 90-120 mmHg</p>
              <p className="text-sm text-gray-600">Diastolic: 60-80 mmHg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Heart Rate</h3>
              <p className="text-sm text-gray-600">60-100 BPM (resting)</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Temperature</h3>
              <p className="text-sm text-gray-600">36.1-37.2 °C</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Fetal Heart Rate</h3>
              <p className="text-sm text-gray-600">110-160 BPM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCharts;