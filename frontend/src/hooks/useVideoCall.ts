// src/hooks/useVideoCall.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';
import toast from 'react-hot-toast';

interface UseVideoCallOptions {
  appointmentId: string;
  channelName: string;
  token: string;
  uid: number;
}

interface UseVideoCallReturn {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  participants: number[];
  duration: number;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
}

export const useVideoCall = ({
  appointmentId,
  channelName,
  token,
  uid
}: UseVideoCallOptions): UseVideoCallReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [participants, setParticipants] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{ video: ILocalVideoTrack | null; audio: ILocalAudioTrack | null }>({
    video: null,
    audio: null
  });
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID as string;

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startCall = useCallback(async (): Promise<void> => {
    try {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current?.subscribe(user, mediaType);
        if (mediaType === 'video') {
          // Play remote video
          setParticipants(prev => [...prev, user.uid]);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });
      
      clientRef.current.on('user-unpublished', (user) => {
        setParticipants(prev => prev.filter(uid => uid !== user.uid));
      });
      
      await clientRef.current.join(APP_ID, channelName, token, uid);
      
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      
      await clientRef.current.publish([audioTrack, videoTrack]);
      
      setIsConnected(true);
      
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start video call');
    }
  }, [APP_ID, channelName, token, uid]);

  const endCall = useCallback(async (): Promise<void> => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
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
    setDuration(0);
    setParticipants([]);
  }, []);

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (localTracksRef.current.video) {
      await localTracksRef.current.video.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(async (): Promise<void> => {
    if (localTracksRef.current.audio) {
      await localTracksRef.current.audio.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [isAudioEnabled]);

  const startScreenShare = useCallback(async (): Promise<void> => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack();
      
      await clientRef.current?.unpublish([localTracksRef.current.video as ILocalVideoTrack]);
      localTracksRef.current.video?.close();
      
      localTracksRef.current.video = screenTrack;
      await clientRef.current?.publish([screenTrack]);
      
      setIsScreenSharing(true);
      
      screenTrack.on('track-ended', () => {
        stopScreenShare();
      });
      
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, []);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    if (localTracksRef.current.video && isScreenSharing) {
      await clientRef.current?.unpublish([localTracksRef.current.video]);
      localTracksRef.current.video.close();
      
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      localTracksRef.current.video = videoTrack;
      await clientRef.current?.publish([videoTrack]);
      
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

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
    stopScreenShare
  };
};