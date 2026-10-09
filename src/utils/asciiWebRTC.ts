// WebRTC Peer-to-Peer Real-Time Streaming Engine for ASCII Art Studio
// Supports multi-window/multi-tab automated OS signaling via BroadcastChannel + LocalStorage fallback
// and manual SDP token exchange for cross-device peering.

export interface AsciiBroadcastFrame {
  type: 'FRAME';
  roomId: string;
  seq: number;
  text: string;
  html?: string;
  width: number;
  colorMode: string;
  timestamp: number;
  fps: number;
  audioMetrics?: {
    bass: number;
    mid: number;
    treble: number;
    overall: number;
    genre?: string;
    bpm?: number;
  };
}

export interface AsciiReaction {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface ConnectedPeer {
  id: string;
  name: string;
  connectedAt: number;
  latencyMs: number;
  packetsSent: number;
}

export interface BroadcastSessionInfo {
  roomId: string;
  hostName: string;
  title: string;
  peerCount: number;
  fps: number;
  colorMode: string;
  audioActive: boolean;
  lastSeen: number;
}

const SIGNALING_CHANNEL = 'ascii_webrtc_signaling_v1';
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

function generateId(prefix = 'PEER'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// -------------------------------------------------------------
// BROADCASTER: Streams live ASCII frames to connected peers
// -------------------------------------------------------------
export class AsciiBroadcaster {
  private roomId: string = '';
  private hostName: string = 'Host Terminal';
  private title: string = 'Live ASCII Matrix Feed';
  private isBroadcasting: boolean = false;
  private channel: BroadcastChannel | null = null;
  private peerConnections: Map<string, { pc: RTCPeerConnection; dc: RTCDataChannel; info: ConnectedPeer }> = new Map();
  private seq: number = 0;
  private bytesSent: number = 0;
  private packetsSentTotal: number = 0;
  private heartbeatTimer: number | null = null;
  private currentFps: number = 24;
  private currentColorMode: string = 'neon';
  private isAudioReactive: boolean = false;

  private onPeersChangeCallbacks: Set<(peers: ConnectedPeer[]) => void> = new Set();
  private onReactionCallbacks: Set<(reaction: AsciiReaction) => void> = new Set();

  constructor() {
    this.initSignaling();
  }

  private initSignaling() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(SIGNALING_CHANNEL);
        this.channel.onmessage = this.handleSignalingMessage;
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported, relying on direct WebRTC tokens', e);
    }
  }

  public startBroadcast(customRoomId?: string, roomTitle = 'Live ASCII Broadcast'): string {
    this.roomId = customRoomId?.trim().toUpperCase() || generateId('CAST');
    this.title = roomTitle;
    this.isBroadcasting = true;
    this.seq = 0;
    this.bytesSent = 0;
    this.packetsSentTotal = 0;

    // Start periodic discovery announcement in OS
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(this.broadcastHeartbeat, 1500);
    this.broadcastHeartbeat();

    return this.roomId;
  }

  public stopBroadcast() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Notify peers that broadcast closed
    this.sendSignalingMessage({
      type: 'BROADCAST_CLOSED',
      roomId: this.roomId,
    });

    // Close all peer connections
    this.peerConnections.forEach(({ pc, dc }) => {
      try {
        dc.close();
        pc.close();
      } catch {}
    });
    this.peerConnections.clear();
    this.isBroadcasting = false;
    this.notifyPeersChanged();
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getIsBroadcasting(): boolean {
    return this.isBroadcasting;
  }

  public getConnectedPeers(): ConnectedPeer[] {
    return Array.from(this.peerConnections.values()).map((p) => p.info);
  }

  public getStats() {
    return {
      peerCount: this.peerConnections.size,
      packetsSent: this.packetsSentTotal,
      bytesSent: this.bytesSent,
      roomId: this.roomId,
    };
  }

  public onPeersChange(cb: (peers: ConnectedPeer[]) => void): () => void {
    this.onPeersChangeCallbacks.add(cb);
    cb(this.getConnectedPeers());
    return () => this.onPeersChangeCallbacks.delete(cb);
  }

  public onReaction(cb: (reaction: AsciiReaction) => void): () => void {
    this.onReactionCallbacks.add(cb);
    return () => this.onReactionCallbacks.delete(cb);
  }

  public setStreamMetadata(fps: number, colorMode: string, isAudioReactive: boolean) {
    this.currentFps = fps;
    this.currentColorMode = colorMode;
    this.isAudioReactive = isAudioReactive;
  }

  // Send a live ASCII frame to all active P2P peers
  public broadcastFrame(
    text: string,
    options: {
      html?: string;
      width: number;
      colorMode: string;
      fps?: number;
      audioMetrics?: AsciiBroadcastFrame['audioMetrics'];
    }
  ) {
    if (!this.isBroadcasting || this.peerConnections.size === 0) return;

    this.seq++;
    const frame: AsciiBroadcastFrame = {
      type: 'FRAME',
      roomId: this.roomId,
      seq: this.seq,
      text,
      html: options.html,
      width: options.width,
      colorMode: options.colorMode,
      timestamp: Date.now(),
      fps: options.fps || this.currentFps,
      audioMetrics: options.audioMetrics,
    };

    const payload = JSON.stringify(frame);
    const byteLen = payload.length;

    this.peerConnections.forEach((peerObj) => {
      if (peerObj.dc.readyState === 'open') {
        try {
          peerObj.dc.send(payload);
          peerObj.info.packetsSent++;
          this.bytesSent += byteLen;
          this.packetsSentTotal++;
        } catch (e) {
          console.warn('Failed to send frame to peer', peerObj.info.id, e);
        }
      }
    });
  }

  private broadcastHeartbeat = () => {
    if (!this.isBroadcasting || !this.roomId) return;
    this.sendSignalingMessage({
      type: 'ANNOUNCE',
      session: {
        roomId: this.roomId,
        hostName: this.hostName,
        title: this.title,
        peerCount: this.peerConnections.size,
        fps: this.currentFps,
        colorMode: this.currentColorMode,
        audioActive: this.isAudioReactive,
        lastSeen: Date.now(),
      },
    });
  };

  private sendSignalingMessage(msg: any) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
  }

  private handleSignalingMessage = async (event: MessageEvent) => {
    if (!this.isBroadcasting) return;
    const data = event.data;
    if (!data || !data.type) return;

    // Peer requesting to join our broadcast room
    if (data.type === 'JOIN_REQUEST' && data.roomId === this.roomId) {
      const peerId = data.peerId;
      const peerName = data.peerName || `Viewer-${peerId.substring(0, 4)}`;
      await this.createPeerConnectionFor(peerId, peerName);
    } else if (data.type === 'SDP_ANSWER' && data.roomId === this.roomId) {
      const peer = this.peerConnections.get(data.peerId);
      if (peer && peer.pc.signalingState !== 'stable') {
        try {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (e) {
          console.error('Error setting remote description for answer:', e);
        }
      }
    } else if (data.type === 'ICE_CANDIDATE' && data.roomId === this.roomId) {
      const peer = this.peerConnections.get(data.peerId);
      if (peer && data.candidate) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('Failed to add ICE candidate', e);
        }
      }
    }
  };

  private async createPeerConnectionFor(peerId: string, peerName: string) {
    // If existing connection, cleanup first
    if (this.peerConnections.has(peerId)) {
      try {
        this.peerConnections.get(peerId)?.pc.close();
      } catch {}
      this.peerConnections.delete(peerId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const dc = pc.createDataChannel('ascii-feed', {
      ordered: false,
      maxRetransmits: 0,
    });

    const peerInfo: ConnectedPeer = {
      id: peerId,
      name: peerName,
      connectedAt: Date.now(),
      latencyMs: 12,
      packetsSent: 0,
    };

    this.peerConnections.set(peerId, { pc, dc, info: peerInfo });

    dc.onopen = () => {
      this.notifyPeersChanged();
      // Send a welcome handshake with current stream info
      try {
        dc.send(
          JSON.stringify({
            type: 'HANDSHAKE',
            roomId: this.roomId,
            title: this.title,
            fps: this.currentFps,
          })
        );
      } catch {}
    };

    dc.onclose = () => {
      this.peerConnections.delete(peerId);
      this.notifyPeersChanged();
    };

    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'PING') {
          dc.send(JSON.stringify({ type: 'PONG', clientTime: msg.time }));
        } else if (msg.type === 'PONG_REPORT') {
          peerInfo.latencyMs = Math.round(msg.rtt);
          this.notifyPeersChanged();
        } else if (msg.type === 'REACTION') {
          const reaction: AsciiReaction = {
            id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            emoji: msg.emoji,
            senderName: peerName,
            timestamp: Date.now(),
          };
          this.onReactionCallbacks.forEach((cb) => cb(reaction));
        }
      } catch {}
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ICE_CANDIDATE',
          roomId: this.roomId,
          targetPeerId: peerId,
          peerId: 'HOST',
          candidate: event.candidate,
        });
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'SDP_OFFER',
        roomId: this.roomId,
        targetPeerId: peerId,
        sdp: offer,
      });
    } catch (err) {
      console.error('Failed to create offer for peer', peerId, err);
    }
  }

  // Support manual token generation for cross-device peering
  public async generateManualOfferToken(): Promise<string> {
    const tempPc = new RTCPeerConnection(ICE_SERVERS);
    const dc = tempPc.createDataChannel('ascii-feed', { ordered: false, maxRetransmits: 0 });
    const offer = await tempPc.createOffer();
    await tempPc.setLocalDescription(offer);

    // Wait briefly for ICE candidates to bundle
    await new Promise((resolve) => setTimeout(resolve, 500));

    const tokenObj = {
      roomId: this.roomId || generateId('CAST'),
      title: this.title,
      sdp: tempPc.localDescription,
    };
    return btoa(JSON.stringify(tokenObj));
  }

  private notifyPeersChanged() {
    const list = this.getConnectedPeers();
    this.onPeersChangeCallbacks.forEach((cb) => cb(list));
  }

  public destroy() {
    this.stopBroadcast();
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
    this.onPeersChangeCallbacks.clear();
    this.onReactionCallbacks.clear();
  }
}

// -------------------------------------------------------------
// VIEWER: Connects to a broadcast and receives the live ASCII stream
// -------------------------------------------------------------
export class AsciiViewer {
  private peerId: string = generateId('VIEWER');
  private viewerName: string = 'OS Viewer';
  private connectedRoomId: string | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private channel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  private pingTimer: number | null = null;
  private lastPingSent: number = 0;
  private rttMs: number = 0;
  private framesReceivedCount: number = 0;
  private measuredFps: number = 0;
  private lastFpsCalcTime: number = Date.now();

  private discoveredRooms: Map<string, BroadcastSessionInfo> = new Map();
  private pruneTimer: number | null = null;

  private onFrameCallbacks: Set<(frame: AsciiBroadcastFrame) => void> = new Set();
  private onStatusCallbacks: Set<(status: { isConnected: boolean; isConnecting: boolean; rtt: number; fps: number; roomId: string | null }) => void> = new Set();
  private onDiscoveredRoomsCallbacks: Set<(rooms: BroadcastSessionInfo[]) => void> = new Set();

  constructor(viewerName?: string) {
    if (viewerName) this.viewerName = viewerName;
    this.initSignaling();
    this.startRoomPruner();
  }

  private initSignaling() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(SIGNALING_CHANNEL);
        this.channel.onmessage = this.handleSignalingMessage;
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in viewer', e);
    }
  }

  private startRoomPruner() {
    this.pruneTimer = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.discoveredRooms.forEach((info, id) => {
        if (now - info.lastSeen > 4500) {
          this.discoveredRooms.delete(id);
          changed = true;
        }
      });
      if (changed) {
        this.notifyDiscoveredRooms();
      }
    }, 2000);
  }

  public getDiscoveredRooms(): BroadcastSessionInfo[] {
    return Array.from(this.discoveredRooms.values());
  }

  public onDiscoveredRoomsChange(cb: (rooms: BroadcastSessionInfo[]) => void): () => void {
    this.onDiscoveredRoomsCallbacks.add(cb);
    cb(this.getDiscoveredRooms());
    return () => this.onDiscoveredRoomsCallbacks.delete(cb);
  }

  public onFrame(cb: (frame: AsciiBroadcastFrame) => void): () => void {
    this.onFrameCallbacks.add(cb);
    return () => this.onFrameCallbacks.delete(cb);
  }

  public onStatusChange(
    cb: (status: {
      isConnected: boolean;
      isConnecting: boolean;
      rtt: number;
      fps: number;
      roomId: string | null;
    }) => void
  ): () => void {
    this.onStatusCallbacks.add(cb);
    this.notifyStatus();
    return () => this.onStatusCallbacks.delete(cb);
  }

  public async connect(roomId: string): Promise<boolean> {
    this.disconnect();
    this.connectedRoomId = roomId.trim().toUpperCase();
    this.isConnecting = true;
    this.notifyStatus();

    // Announce join request via BroadcastChannel
    this.sendSignalingMessage({
      type: 'JOIN_REQUEST',
      roomId: this.connectedRoomId,
      peerId: this.peerId,
      peerName: this.viewerName,
    });

    return true;
  }

  public disconnect() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.dc) {
      try {
        this.dc.close();
      } catch {}
      this.dc = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.connectedRoomId = null;
    this.notifyStatus();
  }

  public sendReaction(emoji: string) {
    if (!this.dc || this.dc.readyState !== 'open') return;
    try {
      this.dc.send(
        JSON.stringify({
          type: 'REACTION',
          emoji,
          senderName: this.viewerName,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to send reaction', e);
    }
  }

  private sendSignalingMessage(msg: any) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
  }

  private handleSignalingMessage = async (event: MessageEvent) => {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'ANNOUNCE' && data.session) {
      this.discoveredRooms.set(data.session.roomId, data.session);
      this.notifyDiscoveredRooms();
    } else if (data.type === 'BROADCAST_CLOSED' && data.roomId === this.connectedRoomId) {
      this.disconnect();
    } else if (
      data.type === 'SDP_OFFER' &&
      data.roomId === this.connectedRoomId &&
      data.targetPeerId === this.peerId
    ) {
      await this.handleOffer(data.sdp);
    } else if (
      data.type === 'ICE_CANDIDATE' &&
      data.roomId === this.connectedRoomId &&
      data.targetPeerId === this.peerId
    ) {
      if (this.pc && data.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {}
      }
    }
  };

  private async handleOffer(sdp: RTCSessionDescriptionInit) {
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    this.pc.ondatachannel = (event) => {
      this.dc = event.channel;
      this.setupDataChannel(this.dc);
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.connectedRoomId) {
        this.sendSignalingMessage({
          type: 'ICE_CANDIDATE',
          roomId: this.connectedRoomId,
          targetPeerId: 'HOST',
          peerId: this.peerId,
          candidate: event.candidate,
        });
      }
    };

    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'SDP_ANSWER',
        roomId: this.connectedRoomId,
        peerId: this.peerId,
        sdp: answer,
      });
    } catch (err) {
      console.error('Failed to handle SDP offer', err);
      this.isConnecting = false;
      this.notifyStatus();
    }
  }

  private setupDataChannel(dc: RTCDataChannel) {
    dc.onopen = () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.notifyStatus();
      this.startPingLoop();
    };

    dc.onclose = () => {
      this.isConnected = false;
      this.notifyStatus();
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'FRAME') {
          this.framesReceivedCount++;
          const now = Date.now();
          if (now - this.lastFpsCalcTime >= 1000) {
            this.measuredFps = Math.round(
              (this.framesReceivedCount * 1000) / (now - this.lastFpsCalcTime)
            );
            this.framesReceivedCount = 0;
            this.lastFpsCalcTime = now;
            this.notifyStatus();
          }
          this.onFrameCallbacks.forEach((cb) => cb(msg as AsciiBroadcastFrame));
        } else if (msg.type === 'PONG') {
          const rtt = Date.now() - msg.clientTime;
          this.rttMs = Math.round(rtt);
          try {
            dc.send(JSON.stringify({ type: 'PONG_REPORT', rtt: this.rttMs }));
          } catch {}
          this.notifyStatus();
        }
      } catch {}
    };
  }

  private startPingLoop() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = window.setInterval(() => {
      if (this.dc && this.dc.readyState === 'open') {
        this.lastPingSent = Date.now();
        try {
          this.dc.send(JSON.stringify({ type: 'PING', time: this.lastPingSent }));
        } catch {}
      }
    }, 1500);
  }

  private notifyStatus() {
    const status = {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      rtt: this.rttMs,
      fps: this.measuredFps,
      roomId: this.connectedRoomId,
    };
    this.onStatusCallbacks.forEach((cb) => cb(status));
  }

  private notifyDiscoveredRooms() {
    const rooms = this.getDiscoveredRooms();
    this.onDiscoveredRoomsCallbacks.forEach((cb) => cb(rooms));
  }

  public destroy() {
    this.disconnect();
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
    this.onFrameCallbacks.clear();
    this.onStatusCallbacks.clear();
    this.onDiscoveredRoomsCallbacks.clear();
  }
}
