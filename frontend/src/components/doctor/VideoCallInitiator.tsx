// frontend/src/components/doctor/VideoCallInitiator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaPhoneSlash, 
  FaDesktop,
  FaUserMd,
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaRecordVinyl,
  FaStop
} from 'react-icons/fa';
import AgoraRTC from 'agora-rtc-sdk-ng';

const DoctorVideoCall = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ video: null, audio: null });
  const durationIntervalRef = useRef(null);
  
  const APP_ID = process.env.REACT_APP_AGORA_APP_ID;

  useEffect(() => {
    fetchAppointmentDetails();
    
    return () => {
      leaveCall();
    };
  }, [appointmentId]);

  useEffect(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await axios.get(`/api/appointments/${appointmentId}`);
      setAppointment(response.data.appointment);
      
      // Fetch patient details
      const patientRes = await axios.get(`/api/patients/${response.data.appointment.patient_id}`);
      setPatient(patientRes.data.patient);
      
      // Check recording consent
      setRecordingConsent(response.data.appointment.recording_consent);
    } catch (error) {
      console.error('Error fetching appointment:', error);
    }
  };

  const joinCall = async () => {
    try {
      // Get token from backend
      const tokenResponse = await axios.post('/api/video/token', {
        appointmentId,
        userId: user.id,
        role: 'publisher'
      });
      
      const { token, channelName } = tokenResponse.data;
      
      // Create client
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Handle remote user events
      clientRef.current.on('user-published', async (remoteUser, mediaType) => {
        await clientRef.current.subscribe(remoteUser, mediaType);
        
        if (mediaType === 'video') {
          remoteUser.videoTrack.play(remoteVideoRef.current);
        }
        
        if (mediaType === 'audio') {
          remoteUser.audioTrack.play();
        }
        
        setParticipants(prev => [...prev, remoteUser.uid]);
      });
      
      clientRef.current.on('user-unpublished', (remoteUser) => {
        setParticipants(prev => prev.filter(uid => uid !== remoteUser.uid));
      });
      
      clientRef.current.on('user-left', (remoteUser) => {
        setParticipants(prev => prev.filter(uid => uid !== remoteUser.uid));
      });
      
      // Join channel
      await clientRef.current.join(APP_ID, channelName, token, user.id);
      
      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      
      // Play local video
      videoTrack.play(localVideoRef.current);
      
      // Publish tracks
      await clientRef.current.publish([audioTrack, videoTrack]);
      
      setIsConnected(true);
      
      // Notify via socket that call started
      if (socket) {
        socket.emit('call-started', { appointmentId });
      }
      
      // Start recording if consented
      if (recordingConsent) {
        startRecording();
      }
      
    } catch (error) {
      console.error('Error joining call:', error);
    }
  };
  
  const leaveCall = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (isRecording) {
      stopRecording();
    }
    
    if (localTracksRef.current.video) {
      localTracksRef.current.video.close();
    }
    if (localTracksRef.current.audio) {
      localTracksRef.current.audio.close();
    }
    
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    
    setIsConnected(false);
    
    // Save call duration to backend
    try {
      await axios.post(`/api/video/call/${appointmentId}/end`, {
        duration,
        recorded: isRecording
      });
    } catch (error) {
      console.error('Error saving call duration:', error);
    }
    
    navigate('/doctor/appointments');
  };
  
  const toggleVideo = () => {
    if (localTracksRef.current.video) {
      localTracksRef.current.video.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  const toggleAudio = () => {
    if (localTracksRef.current.audio) {
      localTracksRef.current.audio.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };
  
  const startScreenShare = async () => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack();
      
      // Replace video track with screen share
      await clientRef.current.unpublish([localTracksRef.current.video]);
      localTracksRef.current.video.close();
      
      localTracksRef.current.video = screenTrack;
      await clientRef.current.publish([screenTrack]);
      
      setIsScreenSharing(true);
      
      screenTrack.on('track-ended', () => {
        stopScreenShare();
      });
      
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };
  
  const stopScreenShare = async () => {
    if (localTracksRef.current.video && isScreenSharing) {
      await clientRef.current.unpublish([localTracksRef.current.video]);
      localTracksRef.current.video.close();
      
      // Recreate camera track
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      localTracksRef.current.video = videoTrack;
      await clientRef.current.publish([videoTrack]);
      videoTrack.play(localVideoRef.current);
      
      setIsScreenSharing(false);
    }
  };
  
  const startRecording = async () => {
    try {
      await axios.post(`/api/video/recording/start`, {
        appointmentId,
        userId: user.id
      });
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = async () => {
    try {
      await axios.post(`/api/video/recording/stop`, {
        appointmentId
      });
      setIsRecording(false);
      toast.success('Recording saved');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaUserMd className="h-6 w-6 text-primary-400" />
          <div>
            <h2 className="font-semibold">
              Video Consultation with {patient?.first_name} {patient?.last_name}
            </h2>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <FaCalendarAlt className="mr-1" size={12} />
                {new Date(appointment.appointment_date).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <FaClock className="mr-1" size={12} />
                {appointment.start_time}
              </span>
              <span className="flex items-center">
                <FaUser className="mr-1" size={12} />
                Participants: {participants.length + 1}
              </span>
            </div>
          </div>
        </div>
        
        {!isConnected && (
          <button
            onClick={joinCall}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
          >
            Start Call
          </button>
        )}
        
        {isConnected && (
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full ${
                isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
            </button>
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`p-2 rounded-full ${
                isScreenSharing ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <FaDesktop />
            </button>
            {recordingConsent && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full ${
                  isRecording ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isRecording ? <FaStop /> : <FaRecordVinyl />}
              </button>
            )}
            <button
              onClick={leaveCall}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-full"
            >
              <FaPhoneSlash />
            </button>
          </div>
        )}
      </div>
      
      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <FaVideoSlash className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
            You
          </div>
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
            Recording
          </div>
        )}
        
        {/* Patient Info Overlay */}
        {patient && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg px-4 py-2 text-white">
            <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
            <p className="text-xs text-gray-300">
              {patient.current_pregnancy_week ? `Week ${patient.current_pregnancy_week}` : 'Pregnancy'}
            </p>
          </div>
        )}
        
        {/* Waiting Screen */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg">Waiting for patient to join...</p>
              <p className="text-gray-400 text-sm mt-2">The patient will join when ready</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Call Info */}
      {isConnected && (
        <div className="bg-gray-800 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {isRecording ? 'This session is being recorded' : 'End-to-end encrypted call'}
            </p>
            <p className="font-mono">
              Duration: {formatDuration(duration)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVideoCall;