// frontend/src/components/patient/MedicalRecords.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaFileMedical, 
  FaDownload, 
  FaEye, 
  FaTrash, 
  FaPlus, 
  FaCalendarAlt,
  FaUserMd,
  FaPills,
  FaFlask,
  FaFilePdf,
  FaFileImage,
  FaFileAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'medical_report',
    file: null,
    notes: ''
  });

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      const [recordsRes, prescriptionsRes, labRes] = await Promise.all([
        axios.get('/api/medical-records'),
        axios.get('/api/prescriptions'),
        axios.get('/api/lab-results')
      ]);
      
      setRecords(recordsRes.data.records);
      setPrescriptions(prescriptionsRes.data.prescriptions);
      setLabResults(labRes.data.results);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('type', uploadForm.type);
    formData.append('file', uploadForm.file);
    formData.append('notes', uploadForm.notes);
    
    try {
      await axios.post('/api/medical-records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Medical record uploaded successfully');
      setShowUploadModal(false);
      setUploadForm({ title: '', type: 'medical_report', file: null, notes: '' });
      fetchAllRecords();
    } catch (error) {
      console.error('Error uploading record:', error);
      toast.error('Failed to upload record');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/medical-records/${id}`);
      toast.success('Record deleted successfully');
      fetchAllRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleDownload = async (record) => {
    try {
      const response = await axios.get(`/api/medical-records/${record.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', record.file_name || `${record.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading record:', error);
      toast.error('Failed to download record');
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (type.includes('image')) return <FaFileImage className="text-blue-500" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const getRecordTypeBadge = (type) => {
    const badges = {
      medical_report: 'bg-blue-100 text-blue-800',
      prescription: 'bg-green-100 text-green-800',
      lab_result: 'bg-purple-100 text-purple-800',
      imaging: 'bg-yellow-100 text-yellow-800',
      vaccination: 'bg-pink-100 text-pink-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const getRecordTypeText = (type) => {
    const texts = {
      medical_report: 'Medical Report',
      prescription: 'Prescription',
      lab_result: 'Lab Result',
      imaging: 'Imaging',
      vaccination: 'Vaccination Record'
    };
    return texts[type] || type;
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
              <h1 className="text-3xl font-bold">Medical Records</h1>
              <p className="mt-2 text-primary-100">Access and manage your health records</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Upload Record
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'records'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaFileMedical className="inline mr-2" />
            Medical Records ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'prescriptions'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaPills className="inline mr-2" />
            Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('labResults')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'labResults'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaFlask className="inline mr-2" />
            Lab Results ({labResults.length})
          </button>
        </div>

        {/* Medical Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            {records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">
                        {getFileIcon(record.file_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRecordTypeBadge(record.type)}`}>
                            {getRecordTypeText(record.type)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <FaCalendarAlt className="mr-1" size={12} />
                            {format(new Date(record.created_at), 'MMM dd, yyyy')}
                          </span>
                          {record.doctor_name && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <FaUserMd className="mr-1" size={12} />
                              Dr. {record.doctor_name}
                            </span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDownload(record)}
                        className="text-green-600 hover:text-green-800 p-2"
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FaFileMedical className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Records</h3>
                <p className="text-gray-500 mb-4">
                  Upload your medical records to keep them organized
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary inline-block"
                >
                  Upload Your First Record
                </button>
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Prescription from {format(new Date(prescription.issued_date), 'MMM dd, yyyy')}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'dispensed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Prescribed by: Dr. {prescription.doctor_name}
                      </p>
                      <div className="space-y-2">
                        {prescription.items?.map((item, idx) => (
                          <div key={idx} className="border-l-2 border-primary-300 pl-3">
                            <p className="font-medium">{item.medication_name}</p>
                            <p className="text-sm text-gray-600">
                              {item.dosage} - {item.frequency} for {item.duration_days} days
                            </p>
                            {item.instructions && (
                              <p className="text-sm text-gray-500">{item.instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {prescription.notes && (
                        <p className="text-sm text-gray-500 mt-3">{prescription.notes}</p>
                      )}
                    </div>
                    {prescription.status === 'active' && (
                      <Link
                        to={`/patient/pharmacy?prescription=${prescription.id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Order Now
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FaPills className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions</h3>
                <p className="text-gray-500">Your prescriptions will appear here after your appointments</p>
              </div>
            )}
          </div>
        )}

        {/* Lab Results Tab */}
        {activeTab === 'labResults' && (
          <div className="space-y-4">
            {labResults.length > 0 ? (
              labResults.map((result) => (
                <div key={result.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{result.test_name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1 mb-3">
                        <span className="text-xs text-gray-500 flex items-center">
                          <FaCalendarAlt className="mr-1" size={12} />
                          {format(new Date(result.test_date), 'MMM dd, yyyy')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.result_status === 'normal' ? 'bg-green-100 text-green-800' :
                          result.result_status === 'abnormal' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.result_status || 'Pending'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Results</h4>
                        <div className="space-y-2">
                          {result.results?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.parameter}</span>
                              <span className="font-medium">
                                {item.value} {item.unit}
                                {item.reference_range && (
                                  <span className="text-gray-400 ml-2">(ref: {item.reference_range})</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {result.interpretation && (
                        <p className="text-sm text-gray-600">{result.interpretation}</p>
                      )}
                    </div>
                    {result.attachment_url && (
                      <button
                        onClick={() => handleDownload(result)}
                        className="text-green-600 hover:text-green-800 p-2"
                      >
                        <FaDownload />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FaFlask className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lab Results</h3>
                <p className="text-gray-500">Your lab results will appear here once available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Upload Medical Record</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Ultrasound Results - Week 20"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type *
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="medical_report">Medical Report</option>
                  <option value="prescription">Prescription</option>
                  <option value="lab_result">Lab Result</option>
                  <option value="imaging">Imaging (X-ray, Ultrasound, MRI)</option>
                  <option value="vaccination">Vaccination Record</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File (PDF, Image) *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB. Supported formats: PDF, JPG, PNG</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  rows="3"
                  className="input-field"
                  placeholder="Add any additional notes about this record..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedRecord.title}</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${getRecordTypeBadge(selectedRecord.type)}`}>
                  {getRecordTypeText(selectedRecord.type)}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  Uploaded on {format(new Date(selectedRecord.created_at), 'MMMM dd, yyyy')}
                </span>
              </div>
              
              {selectedRecord.notes && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-1">Notes</h3>
                  <p className="text-gray-600">{selectedRecord.notes}</p>
                </div>
              )}
              
              {selectedRecord.file_type?.includes('image') ? (
                <img
                  src={`/api/medical-records/${selectedRecord.id}/view`}
                  alt={selectedRecord.title}
                  className="max-w-full rounded-lg"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <FaFilePdf className="h-16 w-16 mx-auto text-red-500 mb-3" />
                  <p className="text-gray-600 mb-4">PDF Document</p>
                  <button
                    onClick={() => handleDownload(selectedRecord)}
                    className="btn-primary"
                  >
                    <FaDownload className="inline mr-2" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;