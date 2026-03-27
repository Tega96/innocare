// frontend/src/components/doctor/ChatInbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  FaPaperPlane, 
  FaArrowLeft, 
  FaUserCircle, 
  FaSearch,
  FaCheck,
  FaCheckDouble,
  FaCalendarAlt,
  FaFileMedical
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorChat = () => {
  const { patientId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [patientTyping, setPatientTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchPatientDetails();
    fetchMessages();
    fetchUnreadCount();
    
    // Mark messages as read
    if (patientId) {
      axios.post(`/api/chat/mark-read/${patientId}`);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [patientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    // Join chat room
    socket.emit('join-chat', { otherUserId: patientId });
    
    socket.on('new-message', (message) => {
      if (message.senderId === patientId) {
        setMessages(prev => [...prev, message]);
        // Mark as read
        socket.emit('mark-read', { senderId: patientId });
      }
    });
    
    socket.on('messages-read', (data) => {
      if (data.byUser === patientId) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === user.id ? { ...msg, is_read: true } : msg
        ));
      }
    });
    
    socket.on('user-typing', (data) => {
      if (data.userId === patientId) {
        setPatientTyping(data.isTyping);
      }
    });
    
    return () => {
      socket.off('new-message');
      socket.off('messages-read');
      socket.off('user-typing');
    };
  }, [socket, patientId, user.id]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`/api/patients/${patientId}`);
      setPatient(response.data.patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/messages/${patientId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/chat/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    
    const messageData = {
      recipientId: patientId,
      message: messageText,
      messageType: 'text',
      consentForRecords: true
    };
    
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    } else {
      try {
        const response = await axios.post('/api/chat/send', messageData);
        setMessages(prev => [...prev, response.data.message]);
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    }
    
    setSending(false);
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { recipientId: patientId, isTyping: true });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing', { recipientId: patientId, isTyping: false });
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return format(date, 'MMM dd');
  };

  const getPatientInitials = () => {
    if (!patient) return '?';
    return `${patient.first_name?.[0]}${patient.last_name?.[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - Patient Info */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-primary-600 text-white">
          <div className="flex items-center space-x-3">
            <Link to="/doctor/dashboard" className="text-white hover:text-primary-200">
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="font-semibold">Messages</h2>
          </div>
        </div>
        
        {patient && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
                <FaUserCircle className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {patient.current_pregnancy_week ? `Week ${patient.current_pregnancy_week}` : 'Patient'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              className="input-field pl-10"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Patient Info</h4>
            {patient && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Age</p>
                  <p className="font-medium">
                    {patient.date_of_birth ? 
                      `${Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} years` : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Blood Group</p>
                  <p className="font-medium">{patient.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Allergies</p>
                  <p className="font-medium">{patient.allergies || 'None reported'}</p>
                </div>
                <div className="pt-3">
                  <Link
                    to={`/doctor/monitor/${patient.id}`}
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <FaFileMedical className="mr-2" />
                    View Medical Records
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {patient?.first_name} {patient?.last_name}
              </h3>
              <p className="text-xs text-gray-500">
                {patientTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
            <Link
              to={`/doctor/appointments?patient=${patientId}`}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              <FaCalendarAlt className="mr-1" />
              View Appointments
            </Link>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user.id;
            return (
              <div
                key={message.id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className={`text-xs ${isOwn ? 'text-primary-100' : 'text-gray-400'}`}>
                      {formatTime(message.created_at)}
                    </span>
                    {isOwn && (
                      message.is_read ? (
                        <FaCheckDouble className="h-3 w-3 text-primary-100" />
                      ) : (
                        <FaCheck className="h-3 w-3 text-primary-100" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {patientTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-2 shadow">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleTyping}
              placeholder="Type your message..."
              className="flex-1 input-field"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary px-6"
            >
              <FaPaperPlane className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Messages are saved with patient consent for medical records
          </p>
        </form>
      </div>
    </div>
  );
};

export default DoctorChat;