// File path: client/src/services/socketService.js

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.pendingListeners = new Map(); // Queue for listeners before socket is ready
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
      timeout: 20000, // Add longer timeout
    });

    this.socket.on('connect', () => {
      // Join user room on connection
      if (userId) {
        this.joinUserRoom(userId);
      } else if (this.userId) {
        this.joinUserRoom(this.userId);
      }

      // Register any pending listeners that were queued before connection
      this.registerPendingListeners();

      // Emit custom connect event for listeners
      this.emitToListeners('connect');
    });

    this.socket.on('disconnect', (reason) => {
      // Emit custom disconnect event for listeners
      this.emitToListeners('disconnect', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
      this.emitToListeners('error', error);
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connect_error:', error.message);
    });

    // Rejoin room and re-register listeners on reconnection
    this.socket.on('reconnect', () => {
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      // Re-register all event listeners after reconnect
      this.reRegisterAllListeners();
      this.emitToListeners('reconnect');
    });

    // Store userId for reconnection
    if (userId) {
      this.userId = userId.toString();
    }

    return this.socket;
  }

  // Register pending listeners when socket becomes ready
  registerPendingListeners() {
    if (!this.socket) return;

    this.pendingListeners.forEach((callback, event) => {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    });
    this.pendingListeners.clear();
  }

  // Re-register all listeners (for reconnection)
  reRegisterAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callback, event) => {
      // Skip built-in events
      if (!['connect', 'disconnect', 'error', 'reconnect'].includes(event)) {
        // Remove old listener and re-add
        this.socket.off(event, callback);
        this.socket.on(event, callback);
      }
    });
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
      this.pendingListeners.clear();
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

    // If socket exists and is connected, register immediately
    if (this.socket?.connected) {
      // Remove existing listener to avoid duplicates
      const existingCallback = this.listeners.get(event);
      if (existingCallback) {
        this.socket.off(event, existingCallback);
      }

      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    } else {
      // Socket not ready - queue the listener
      this.pendingListeners.set(event, callback);
      this.listeners.set(event, callback);

      // Try to connect if not already connecting
      if (!this.socket) {
        this.connect(null, this.userId);
      }
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
    this.pendingListeners.delete(event);
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
