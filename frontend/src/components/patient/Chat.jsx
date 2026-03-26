import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { FaPaperPlane, FaArrowLeft, FaUserMd, FaCheck, FaCheckDouble } from 'react-icons/fa';

const Chat = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [doctorTyping, setDoctorTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDoctorDetails();
    fetchMessages();
    
    // Join chat room
    if (socket && doctorId) {
      socket.emit('join-chat', { otherUserId: doctorId });
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [doctorId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-message', (message) => {
      if (message.senderId === doctorId) {
        setMessages(prev => [...prev, message]);
        // Mark as read
        socket.emit('mark-read', { senderId: doctorId });
      }
    });
    
    socket.on('messages-read', (data) => {
      if (data.byUser === doctorId) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === user.id ? { ...msg, is_read: true } : msg
        ));
      }
    });
    
    socket.on('user-typing', (data) => {
      if (data.userId === doctorId) {
        setDoctorTyping(data.isTyping);
      }
    });
    
    return () => {
      socket.off('new-message');
      socket.off('messages-read');
      socket.off('user-typing');
    };
  }, [socket, doctorId, user.id]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get(`/api/doctors/${doctorId}`);
      setDoctor(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/messages/${doctorId}`);
      setMessages(response.data.messages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
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
      recipientId: doctorId,
      message: messageText,
      messageType: 'text',
      consentForRecords: true
    };
    
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    } else {
      // Fallback to REST API
      try {
        await axios.post('/api/chat/send', messageData);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
    
    setSending(false);
  };

  const handleTyping = () => {
    if (!typing && socket) {
      setTyping(true);
      socket.emit('typing', { recipientId: doctorId, isTyping: true });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing', { recipientId: doctorId, isTyping: false });
      }
      setTyping(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link to="/patient/dashboard" className="text-gray-600 hover:text-gray-900">
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center">
                <FaUserMd className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Dr. {doctor?.first_name} {doctor?.last_name}
                </h2>
                <p className="text-xs text-gray-500">
                  {doctor?.specialization}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        
        {doctorTyping && (
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
          Messages are saved with your consent for medical records
        </p>
      </form>
    </div>
  );
};

export default Chat;