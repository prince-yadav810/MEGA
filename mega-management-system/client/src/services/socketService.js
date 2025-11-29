// File path: client/src/services/socketService.js

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.userId = null;
  }

  connect(url, userId = null) {
    if (this.socket?.connected) {
      // If userId is provided and different, rejoin room
      if (userId && userId !== this.userId) {
        this.joinUserRoom(userId);
      }
      return this.socket;
    }

    // In production, use current origin (same domain). In development, use localhost.
    const SOCKET_URL = url || (
      process.env.NODE_ENV === 'production'
        ? window.location.origin
        : (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001')
    );

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
      // Join user room on connection
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    // Rejoin room on reconnection
    this.socket.on('reconnect', () => {
      console.log('🔄 Socket.io reconnected');
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
    });

    return this.socket;
  }

  joinUserRoom(userId) {
    if (!this.socket || !userId) return;
    
    // Leave old room if exists
    if (this.userId && this.userId !== userId) {
      this.socket.emit('leave-user-room', this.userId);
    }
    
    this.userId = userId;
    this.socket.emit('join-user-room', userId);
    console.log(`📍 Joined user room: user:${userId}`);
  }

  disconnect() {
    if (this.socket) {
      // Leave user room before disconnecting
      if (this.userId) {
        this.socket.emit('leave-user-room', this.userId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.userId = null;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      return;
    }

    // Store listener for cleanup
    this.listeners.set(event, callback);
    this.socket.on(event, callback);
  }

  off(event) {
    if (!this.socket) return;

    const callback = this.listeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      return;
    }

    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
