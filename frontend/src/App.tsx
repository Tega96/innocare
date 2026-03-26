// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import PatientRegister from './components/auth/PatientRegister';
import DoctorRegister from './components/auth/DoctorRegister';
import Verification from './components/auth/Verification';

// Patient Pages
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import AppointmentBooking from './components/patient/AppointmentBooking';
import HealthStatus from './components/patient/HealthStatus';
import Pharmacy from './components/patient/Pharmacy';
import VideoCall from './components/patient/VideoCall';
import Chat from './components/patient/Chat';
import MedicalRecords from './components/patient/MedicalRecords';

// Doctor Pages
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PatientList from './components/doctor/PatientList';
import AppointmentManager from './components/doctor/AppointmentManager';
import PatientHealthMonitor from './components/doctor/PatientHealthMonitor';
import DoctorVideoCall from './components/doctor/VideoCallInitiator';
import DoctorChat from './components/doctor/ChatInbox';
import Earnings from './components/doctor/Earnings';

// Admin Pages
import AdminDashboard from './components/admin/AdminDashboard';
import InventoryManagement from './components/admin/InventoryManagement';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50">
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register/patient" element={<PatientRegister />} />
                <Route path="/register/doctor" element={<DoctorRegister />} />
                <Route path="/verify" element={<Verification />} />
                
                {/* Patient Routes */}
                <Route path="/patient" element={<PrivateRoute role="patient" />}>
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="search-doctors" element={<DoctorSearch />} />
                  <Route path="book-appointment/:doctorId" element={<AppointmentBooking />} />
                  <Route path="health-status" element={<HealthStatus />} />
                  <Route path="pharmacy" element={<Pharmacy />} />
                  <Route path="video-call/:appointmentId" element={<VideoCall />} />
                  <Route path="chat/:doctorId" element={<Chat />} />
                  <Route path="medical-records" element={<MedicalRecords />} />
                </Route>
                
                {/* Doctor Routes */}
                <Route path="/doctor" element={<PrivateRoute role="doctor" />}>
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="patients" element={<PatientList />} />
                  <Route path="appointments" element={<AppointmentManager />} />
                  <Route path="monitor/:patientId" element={<PatientHealthMonitor />} />
                  <Route path="video-call/:appointmentId" element={<DoctorVideoCall />} />
                  <Route path="chat/:patientId" element={<DoctorChat />} />
                  <Route path="earnings" element={<Earnings />} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin" element={<PrivateRoute role="admin" />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="inventory" element={<InventoryManagement />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;