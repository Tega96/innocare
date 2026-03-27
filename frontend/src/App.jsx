import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// // Auth Components
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
import HealthCharts from './components/patient/HealthCharts';

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
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Layout wrapper component
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarFooter = location.pathname.includes('/video-call');
  
  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <ErrorBoundary>
        <main className={!hideNavbarFooter ? 'min-h-screen' : ''}>
          {children}
        </main>
      </ErrorBoundary>
      {!hideNavbarFooter && <Footer />}
    </>
  );
};

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
              
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register/patient" element={<PatientRegister />} />
                  <Route path="/register/doctor" element={<DoctorRegister />} />
                  <Route path="/verify" element={<Verification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} /> 
                  
                  {/* Patient Routes */}
                  <Route path="/patient" element={<PrivateRoute role="patient" />}>
                    <Route index element={<Navigate to="/patient/dashboard" replace />} />
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="search-doctors" element={<DoctorSearch />} />
                    <Route path="book-appointment/:doctorId" element={<AppointmentBooking />} />
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="health-status" element={<HealthStatus />} />
                    <Route path="health-charts" element={<HealthCharts />} />
                    <Route path="pharmacy" element={<Pharmacy />} />
                    <Route path="prescriptions" element={<PrescriptionOrders />} />
                    <Route path="video-call/:appointmentId" element={<VideoCall />} />
                    <Route path="chat/:doctorId" element={<Chat />} />
                    <Route path="medical-records" element={<MedicalRecords />} />
                  </Route>
                  
                  {/* Doctor Routes */}
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
                  
                  {/* Admin Routes */}
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
              </Layout>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;