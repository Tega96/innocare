// frontend/src/hooks/useVideoCall.js
import { useState, useCallback, useRef } from 'react';
import videoService from '../services/videoService';
import toast from 'react-hot-toast';

export const useVideoCall = (appointmentId, channelName, token, uid) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [duration, setDuration] = useState(0);
  const durationInterval = useRef(null);

  const startCall = useCallback(async () => {
    try {
      await videoService.joinChannel(channelName, token, uid);
      const { audioTrack, videoTrack } = await videoService.createLocalTracks();
      await videoService.publishLocalTracks();
      
      setIsConnected(true);
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Set up event listeners
      videoService.on('user-published', async (user, mediaType) => {
        await videoService.client.subscribe(user, mediaType);
        setParticipants(prev => [...prev, user.uid]);
      });
      
      videoService.on('user-unpublished', (user) => {
        setParticipants(prev => prev.filter(uid => uid !== user.uid));
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start video call');
    }
  }, [channelName, token, uid]);

  const endCall = useCallback(async () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    await videoService.leaveChannel();
    setIsConnected(false);
    setDuration(0);
    setParticipants([]);
  }, []);

  const toggleVideo = useCallback(async () => {
    const enabled = await videoService.toggleVideo(!isVideoEnabled);
    setIsVideoEnabled(enabled);
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    const enabled = await videoService.toggleAudio(!isAudioEnabled);
    setIsAudioEnabled(enabled);
  }, [isAudioEnabled]);

  const startScreenShare = useCallback(async () => {
    const screenTrack = await videoService.createScreenShare();
    await videoService.unpublishLocalTracks();
    await videoService.client.publish([screenTrack]);
    setIsScreenSharing(true);
  }, []);

  const stopScreenShare = useCallback(async () => {
    await videoService.unpublishLocalTracks();
    const { videoTrack } = await videoService.createLocalTracks();
    await videoService.client.publish([videoTrack]);
    setIsScreenSharing(false);
  }, []);

  return {
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    participants,
    duration,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  };
};