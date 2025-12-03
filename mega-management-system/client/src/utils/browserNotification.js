// Browser Notification Utility
// Handles desktop notifications using the Notifications API

class BrowserNotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.audioContext = null;
    this.notificationSounds = {};
    
    if (this.isSupported) {
      this.permission = Notification.permission;
    }

    // Initialize audio context for notification sounds
    this.initAudioContext();
    this.loadNotificationSounds();
  }

  /**
   * Initialize Web Audio API context
   */
  initAudioContext() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Load notification sound files
   */
  loadNotificationSounds() {
    // Create audio elements for notification sounds
    // These will produce a pleasant notification sound similar to WhatsApp
    this.notificationSounds = {
      default: this.createNotificationSound([800, 1000], 0.3),
      task: this.createNotificationSound([600, 800, 1000], 0.3),
      reminder: this.createNotificationSound([1000, 1200, 1000], 0.35),
      message: this.createNotificationSound([700, 900], 0.3),
    };
  }

  /**
   * Create a notification sound using Web Audio API with multiple tones
   * @param {Array} frequencies - Array of frequencies to play in sequence
   * @param {Number} toneDuration - Duration of each tone
   */
  createNotificationSound(frequencies, toneDuration = 0.15) {
    return () => {
      if (!this.audioContext) return;

      try {
        let currentTime = this.audioContext.currentTime;

        frequencies.forEach((frequency, index) => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';

          const startTime = currentTime + (index * toneDuration);
          const endTime = startTime + toneDuration;

          // Envelope for smoother sound (attack, decay)
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + toneDuration * 0.3);
          gainNode.gain.linearRampToValueAtTime(0, endTime);

          oscillator.start(startTime);
          oscillator.stop(endTime);
        });
      } catch (error) {
        console.warn('Error playing notification sound:', error);
      }
    };
  }

  /**
   * Play notification sound with fallback
   */
  playNotificationSound(soundType = 'default') {
    try {
      // Resume audio context if suspended (required by browser autoplay policies)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const sound = this.notificationSounds[soundType] || this.notificationSounds.default;
      if (sound) {
        sound();
      }
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus() {
    return this.permission;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a desktop notification
   * @param {string} title - Notification title (Heading)
   * @param {Object} options - Notification options
   * @param {string} options.body - Notification body/description (Main message)
   * @param {string} options.icon - Icon URL
   * @param {string} options.badge - Badge URL
   * @param {string} options.tag - Unique tag for notification
   * @param {boolean} options.requireInteraction - Keep notification visible until user interacts
   * @param {boolean} options.silent - Silent notification (no sound)
   * @param {string} options.sound - Sound type to play ('default', 'task', 'reminder', 'message')
   * @param {Object} options.data - Additional data to attach to notification
   * @param {Function} options.onClick - Callback when notification is clicked
   * @param {Function} options.onClose - Callback when notification is closed
   * @param {Function} options.onError - Callback when notification errors
   */
  async show(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    // Request permission if not already granted
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }
    }

    try {
      // Play notification sound (unless silent)
      if (!options.silent) {
        const soundType = options.sound || 'default';
        this.playNotificationSound(soundType);
      }

      // Prepare notification options
      const notificationOptions = {
        body: options.body || '',
        icon: options.icon || '/logo192.png', // Use your app logo
        badge: options.badge || '/favicon.ico',
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
        silent: true, // We handle sound ourselves for better control
        data: options.data || {},
        timestamp: Date.now(),
        // Make it more prominent like WhatsApp
        renotify: true, // Re-alert even if same tag
      };

      // Add vibration if provided (works on mobile)
      if (options.vibrate) {
        notificationOptions.vibrate = options.vibrate;
      }

      // Add image if provided (shows below the notification)
      if (options.image) {
        notificationOptions.image = options.image;
      }

      // Add actions if provided (for supported browsers - Android Chrome, etc.)
      if (options.actions && Array.isArray(options.actions)) {
        notificationOptions.actions = options.actions;
      }

      // Format the body with better line breaks for readability
      if (options.body) {
        notificationOptions.body = options.body;
      }

      // Add direction for better text display
      notificationOptions.dir = options.dir || 'auto';

      // Create the notification
      const notification = new Notification(title, notificationOptions);

      // Set up event handlers
      if (options.onClick) {
        notification.onclick = (event) => {
          event.preventDefault(); // Prevent default behavior
          window.focus(); // Focus the window
          options.onClick(notification, event);
          notification.close();
        };
      } else {
        // Default click handler - focus window
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();
        };
      }

      if (options.onClose) {
        notification.onclose = () => options.onClose(notification);
      }

      if (options.onError) {
        notification.onerror = (error) => options.onError(error, notification);
      }

      // Auto-close notification after a timeout (default: 8 seconds, like WhatsApp)
      if (!options.requireInteraction) {
        const timeout = options.timeout || 8000;
        setTimeout(() => {
          notification.close();
        }, timeout);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    }
  }

  /**
   * Show a notification with predefined category styling (WhatsApp-like)
   * @param {string} category - Notification category (task, client, quotation, etc.)
   * @param {string} title - Notification title (Heading)
   * @param {string} message - Notification message (Description)
   * @param {Object} data - Additional data
   */
  async showCategorized(category, title, message, data = {}) {
    const categoryConfig = {
      task: {
        icon: '/logo192.png',
        badge: '📋',
        vibrate: [200, 100, 200],
        sound: 'task',
        emoji: '📋'
      },
      client: {
        icon: '/logo192.png',
        badge: '👥',
        vibrate: [200],
        sound: 'message',
        emoji: '👥'
      },
      quotation: {
        icon: '/logo192.png',
        badge: '📄',
        vibrate: [200],
        sound: 'message',
        emoji: '📄'
      },
      product: {
        icon: '/logo192.png',
        badge: '📦',
        vibrate: [200],
        sound: 'message',
        emoji: '📦'
      },
      note: {
        icon: '/logo192.png',
        badge: '📝',
        vibrate: [100],
        sound: 'message',
        emoji: '📝'
      },
      reminder: {
        icon: '/logo192.png',
        badge: '⏰',
        vibrate: [300, 100, 300],
        sound: 'reminder',
        emoji: '⏰'
      },
      payment: {
        icon: '/logo192.png',
        badge: '💰',
        vibrate: [200, 100, 200, 100, 200],
        sound: 'reminder',
        emoji: '💰'
      },
      system: {
        icon: '/logo192.png',
        badge: '⚙️',
        vibrate: [100],
        sound: 'default',
        emoji: 'ℹ️'
      },
    };

    const config = categoryConfig[category] || categoryConfig.system;

    // Format title with emoji for better visual appeal (like WhatsApp)
    const formattedTitle = `${config.emoji} ${title}`;

    // Format message for better readability
    const formattedMessage = message || 'You have a new notification';

    return this.show(formattedTitle, {
      body: formattedMessage,
      icon: config.icon,
      badge: config.badge,
      vibrate: config.vibrate,
      sound: config.sound,
      silent: false, // Enable sound
      tag: `${category}-${Date.now()}`,
      renotify: true,
      data: {
        category,
        ...data,
      },
      timeout: 8000, // 8 seconds (like WhatsApp)
      requireInteraction: false,
    });
  }

  /**
   * Clear all notifications with a specific tag
   * Note: This only works for notifications created by this app
   */
  clearByTag(tag) {
    // This is a limitation of the Notifications API
    // We can't programmatically clear notifications once created
    console.warn('Clearing notifications by tag is not supported in the Notifications API');
  }

  /**
   * Check if the user has enabled Do Not Disturb or similar
   * Returns true if notifications are likely to be blocked
   */
  isLikelyBlocked() {
    if (!this.isSupported) return true;
    if (this.permission !== 'granted') return true;
    
    // Additional checks can be added here based on browser/OS
    return false;
  }
}

// Export singleton instance
const browserNotificationService = new BrowserNotificationService();
export default browserNotificationService;

