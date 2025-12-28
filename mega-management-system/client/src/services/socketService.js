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
      // Emit custom connect event for listeners
      this.emitToListeners('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      // Emit custom disconnect event for listeners
      this.emitToListeners('disconnect', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
      this.emitToListeners('error', error);
    });

    // Rejoin room on reconnection
    this.socket.on('reconnect', () => {
      console.log('🔄 Socket.io reconnected');
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      this.emitToListeners('reconnect');
    });

    return this.socket;
  }

  joinUserRoom(userId) {
    if (!this.socket || !userId) {
      console.warn('⚠️  Cannot join user room: socket or userId missing');
      return;
    }
    
    // Ensure userId is a string
    const userIdStr = userId.toString();
    
    // Leave old room if exists
    if (this.userId && this.userId.toString() !== userIdStr) {
      this.socket.emit('leave-user-room', this.userId.toString());
    }
    
    this.userId = userIdStr;
    this.socket.emit('join-user-room', userIdStr);
    console.log(`📍 Joined user room: user:${userIdStr}`);
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
    // Handle built-in socket events
    if (['connect', 'disconnect', 'error', 'reconnect'].includes(event)) {
      // Store listener for built-in events
      this.listeners.set(event, callback);
      // These are already set up in connect(), just store the callback
      return;
    }

    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      // Try to connect if not connected
      if (this.userId) {
        this.connect(null, this.userId);
      }
      return;
    }

    // Store listener for cleanup
    this.listeners.set(event, callback);
    this.socket.on(event, callback);
    
    // Log for debugging
    if (event === 'notification:new') {
      console.log('📡 Socket listener registered for notification:new');
    }
  }

  // Helper to emit to stored listeners
  emitToListeners(event, data) {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
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
