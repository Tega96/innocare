// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/common/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Auth Components
import Login from './components/auth/Login';
import PatientRegister from './components/auth/PatientRegister';
import DoctorRegister from './components/auth/DoctorRegister';
import Verification from './components/auth/Verification';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Patient Components
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import AppointmentBooking from './components/patient/AppointmentBooking';
import HealthStatus from './components/patient/HealthStatus';
import Pharmacy from './components/patient/Pharmacy';
import VideoCall from './components/patient/VideoCall';
import Chat from './components/patient/Chat';
import MedicalRecords from './components/patient/MedicalRecords';
import PatientAppointments from './components/patient/PatientAppointments';
import PrescriptionOrders from './components/patient/PrescriptionOrder';

// Doctor Components
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PatientList from './components/doctor/PatientList';
import AppointmentManager from './components/doctor/AppointmentManager';
import PatientHealthMonitor from './components/doctor/PatientHealthMonitor';
import DoctorVideoCall from './components/doctor/VideoCallInitiator';
import DoctorChat from './components/doctor/ChatInbox';
import Earnings from './components/doctor/Earnings';
import DoctorProfile from './components/doctor/DoctorProfile';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import InventoryManagement from './components/admin/InventoryManagement';
import DoctorManagement from './components/admin/DoctorManagement';
import Reports from './components/admin/Reports';
import UserManagement from './components/admin/UserManagement';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
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
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#10b981',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#ef4444',
                    },
                  },
                  loading: {
                    style: {
                      background: '#3b82f6',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Public Routes - No Authentication Required */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register/patient" element={<PatientRegister />} />
                <Route path="/register/doctor" element={<DoctorRegister />} />
                <Route path="/verify" element={<Verification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Patient Routes - Protected */}
                <Route path="/patient" element={<PrivateRoute role="patient" />}>
                  <Route index element={<Navigate to="/patient/dashboard" replace />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="search-doctors" element={<DoctorSearch />} />
                  <Route path="book-appointment/:doctorId" element={<AppointmentBooking />} />
                  <Route path="appointments" element={<PatientAppointments />} />
                  <Route path="health-status" element={<HealthStatus />} />
                  <Route path="pharmacy" element={<Pharmacy />} />
                  <Route path="prescriptions" element={<PrescriptionOrders />} />
                  <Route path="video-call/:appointmentId" element={<VideoCall />} />
                  <Route path="chat/:doctorId" element={<Chat />} />
                  <Route path="medical-records" element={<MedicalRecords />} />
                </Route>
                
                {/* Doctor Routes - Protected */}
                <Route path="/doctor" element={<PrivateRoute role="doctor" />}>
                  <Route index element={<Navigate to="/doctor/dashboard" replace />} />
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="patients" element={<PatientList />} />
                  <Route path="appointments" element={<AppointmentManager />} />
                  <Route path="monitor/:patientId" element={<PatientHealthMonitor />} />
                  <Route path="video-call/:appointmentId" element={<DoctorVideoCall />} />
                  <Route path="chat/:patientId" element={<DoctorChat />} />
                  <Route path="earnings" element={<Earnings />} />
                  <Route path="profile" element={<DoctorProfile />} />
                </Route>
                
                {/* Admin Routes - Protected */}
                <Route path="/admin" element={<PrivateRoute role="admin" />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="inventory" element={<InventoryManagement />} />
                  <Route path="doctors" element={<DoctorManagement />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;