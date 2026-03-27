// frontend/src/components/common/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  FaBaby, 
  FaUserMd, 
  FaUser, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaBell,
  FaCalendarAlt,
  FaHeartbeat,
  FaPills,
  FaComments,
  FaChartLine,
  FaUserCircle,
  FaChevronDown,
  FaFileMedical,
  FaMoneyBillWave,
  FaUsers,
  FaBoxes
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Simulate fetching notifications
      // In production, this would be an API call
      const mockNotifications = [
        {
          id: 1,
          title: 'Appointment Reminder',
          message: 'You have an appointment tomorrow at 10:00 AM',
          type: 'appointment',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Prescription Ready',
          message: 'Your prescription has been approved and is ready for order',
          type: 'prescription',
          read: true,
          createdAt: new Date().toISOString()
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    toast.success('Logged out successfully');
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
      ];
    }

    switch (user.role) {
      case 'patient':
        return [
          { to: '/patient/dashboard', label: 'Dashboard', icon: FaUser },
          { to: '/patient/search-doctors', label: 'Find Doctors', icon: FaUserMd },
          { to: '/patient/appointments', label: 'Appointments', icon: FaCalendarAlt },
          { to: '/patient/health-status', label: 'Health Status', icon: FaHeartbeat },
          { to: '/patient/pharmacy', label: 'Pharmacy', icon: FaPills },
        ];
      case 'doctor':
        return [
          { to: '/doctor/dashboard', label: 'Dashboard', icon: FaUserMd },
          { to: '/doctor/patients', label: 'Patients', icon: FaUsers },
          { to: '/doctor/appointments', label: 'Appointments', icon: FaCalendarAlt },
          { to: '/doctor/earnings', label: 'Earnings', icon: FaMoneyBillWave },
        ];
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: FaChartLine },
          { to: '/admin/users', label: 'Users', icon: FaUsers },
          { to: '/admin/doctors', label: 'Doctors', icon: FaUserMd },
          { to: '/admin/inventory', label: 'Inventory', icon: FaBoxes },
          { to: '/admin/reports', label: 'Reports', icon: FaFileMedical },
        ];
      default:
        return [];
    }
  };

  const getUserName = () => {
    if (!user) return 'Account';
    if (user.role === 'patient') {
      return user.profile?.first_name || 'Patient';
    }
    if (user.role === 'doctor') {
      return `Dr. ${user.profile?.first_name || 'Doctor'}`;
    }
    return 'Admin';
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.role === 'patient') {
      return `${user.profile?.first_name?.[0] || ''}${user.profile?.last_name?.[0] || ''}`.toUpperCase();
    }
    if (user.role === 'doctor') {
      return user.profile?.first_name?.[0]?.toUpperCase() || 'D';
    }
    return 'A';
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = getNavLinks();

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-lg backdrop-blur-sm bg-white/95' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-primary-100 p-1.5 rounded-lg group-hover:bg-primary-200 transition-colors">
                <FaBaby className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                MaternityCare
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
                  >
                    <FaBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-slide-down">
                      <div className="p-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notif.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <p>No notifications</p>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t bg-gray-50 text-center">
                        <button className="text-xs text-primary-600 hover:text-primary-700">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Connection Status */}
              {user && (
                <div className="hidden sm:flex items-center">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`} />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {getUserInitials()}
                      </span>
                    </div>
                    <span className="hidden md:inline text-sm font-medium text-gray-700">
                      {getUserName()}
                    </span>
                    <FaChevronDown className="h-3 w-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-slide-down">
                      <div className="p-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{user.role}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to={`/${user.role}/profile`}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaUserCircle className="mr-3 h-4 w-4 text-gray-400" />
                          Profile Settings
                        </Link>
                        {user.role === 'patient' && (
                          <Link
                            to="/patient/medical-records"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FaFileMedical className="mr-3 h-4 w-4 text-gray-400" />
                            Medical Records
                          </Link>
                        )}
                        {user.role === 'doctor' && (
                          <Link
                            to="/doctor/earnings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FaMoneyBillWave className="mr-3 h-4 w-4 text-gray-400" />
                            Earnings
                          </Link>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FaSignOutAlt className="mr-3 h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register/patient"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-3 ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {!user && (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register/patient"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
              
              {user && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding under navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;