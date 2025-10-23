// File path: client/src/services/socketService.js

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(url) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const SOCKET_URL = url || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
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
