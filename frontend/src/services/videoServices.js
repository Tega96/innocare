// frontend/src/services/videoService.js
import AgoraRTC from 'agora-rtc-sdk-ng';

class VideoService {
  constructor() {
    this.client = null;
    this.localTracks = { audio: null, video: null };
    this.remoteUsers = new Map();
    this.appId = process.env.REACT_APP_AGORA_APP_ID;
  }

  async init() {
    if (this.client) return this.client;
    
    this.client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8',
      role: 'host'
    });
    
    return this.client;
  }

  async joinChannel(channelName, token, uid, role = 'host') {
    await this.init();
    
    this.client.setClientRole(role);
    await this.client.join(this.appId, channelName, token, uid);
    
    return this.client;
  }

  async createLocalTracks() {
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    this.localTracks = { audio: audioTrack, video: videoTrack };
    return { audioTrack, videoTrack };
  }

  async publishLocalTracks() {
    if (!this.client) throw new Error('Client not initialized');
    
    const tracks = Object.values(this.localTracks).filter(t => t);
    if (tracks.length) {
      await this.client.publish(tracks);
    }
  }

  async unpublishLocalTracks() {
    if (!this.client) return;
    
    const tracks = Object.values(this.localTracks).filter(t => t);
    if (tracks.length) {
      await this.client.unpublish(tracks);
    }
  }

  async leaveChannel() {
    if (this.localTracks.audio) {
      this.localTracks.audio.close();
    }
    if (this.localTracks.video) {
      this.localTracks.video.close();
    }
    this.localTracks = { audio: null, video: null };
    
    if (this.client) {
      await this.client.leave();
    }
  }

  async toggleVideo(enabled) {
    if (this.localTracks.video) {
      await this.localTracks.video.setEnabled(enabled);
    }
  }

  async toggleAudio(enabled) {
    if (this.localTracks.audio) {
      await this.localTracks.audio.setEnabled(enabled);
    }
  }

  async createScreenShare() {
    const screenTrack = await AgoraRTC.createScreenVideoTrack();
    return screenTrack;
  }

  on(event, callback) {
    if (!this.client) return;
    this.client.on(event, callback);
  }

  off(event, callback) {
    if (!this.client) return;
    this.client.off(event, callback);
  }
}

export default new VideoService();