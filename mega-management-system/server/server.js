// File path: server/server.js

// Load env vars FIRST before any other imports that depend on them
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const notesRoutes = require('./src/routes/notes');
const remindersRoutes = require('./src/routes/reminders');
const callLogRoutes = require('./src/routes/callLogRoutes');
const paymentReminderScheduler = require('./src/services/paymentReminderScheduler');
const attendanceCleanupScheduler = require('./src/services/attendanceCleanupScheduler');
const attendanceLocationCleanupService = require('./src/services/attendanceLocationCleanupService');

// Connect to database
connectDB();

// Start Payment Reminder Scheduler
// In Cloud Run: Set DISABLE_CRON=true and use Cloud Scheduler instead
const DISABLE_CRON = process.env.DISABLE_CRON === 'true';

if (!DISABLE_CRON) {
  setTimeout(() => {
    // Set Socket.IO instance for scheduler notifications
    paymentReminderScheduler.setSocketIO(io);

    paymentReminderScheduler.start();
    attendanceCleanupScheduler.start();
    attendanceLocationCleanupService.start();  // Start location cleanup service
  }, 5000); // Wait 5 seconds after server start to ensure DB is connected
} else {
  console.log('⚠️  Internal cron disabled. Use /api/scheduler/trigger endpoint for Cloud Scheduler.');
}

const app = express();
const server = http.createServer(app);

// CORS Configuration - Allow both local and production origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://mega-management-411708517030.asia-south1.run.app',
  'https://app.megaenterprise.in',
  'https://megaenterprise.in'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ⭐ CORS must load first
app.use(cors(corsOptions));

// Body parser middleware - increased limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging for push endpoints (debug)
app.use('/api/push', (req, res, next) => {
  console.log(`📨 [PUSH REQUEST] ${req.method} ${req.originalUrl} from ${req.ip}`);
  console.log(`   Headers: Auth=${req.headers.authorization ? 'Present' : 'MISSING'}`);
  next();
});

// ⭐ YOUR express-fileupload middleware
// Exclude business card route (uses multer instead)
app.use((req, res, next) => {
  // Skip express-fileupload for business card route (uses multer)
  if (req.path === '/api/clients/extract-from-card') {
    return next();
  }

  // Apply express-fileupload to all other routes
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (increased for document uploads)
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded',
    createParentPath: true
  })(req, res, next);
});

// Attach socket.io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Static uploads folder - only in development
// In production (Cloud Run), files are served from Cloudinary
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  // In production, redirect /uploads to indicate files should be on Cloudinary
  app.use('/uploads', (req, res) => {
    console.warn(`⚠️  Attempted to access local upload: ${req.path}. Files should be stored in Cloudinary.`);
    res.status(404).json({
      error: 'File not found',
      message: 'Local file storage is not available in production. Files should be stored in cloud storage (Cloudinary).'
    });
  });
}

// ⭐ YOUR ROUTES
app.use('/api/notes', notesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/quotations', require('./src/routes/quotations'));
app.use('/api/clients', require('./src/routes/clients'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/push', require('./src/routes/pushSubscriptions'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/api-usage', require('./src/routes/apiUsage'));
app.use('/api/call-logs', callLogRoutes);
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/whatsapp', require('./src/routes/whatsapp'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/documents', require('./src/routes/documents'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MEGA Management Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configuration check endpoint (for debugging)
app.get('/api/config-check', (req, res) => {
  const cloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );

  res.json({
    status: 'OK',
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      cloudinaryConfigured: cloudinaryConfigured,
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?
        process.env.CLOUDINARY_CLOUD_NAME.substring(0, 5) + '...' : 'NOT SET',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      visionConfigured: !!process.env.GOOGLE_VISION_API_KEY,
      mongodbConfigured: !!process.env.MONGODB_URI,
      clientUrl: process.env.CLIENT_URL || 'NOT SET',
      jwtConfigured: !!process.env.JWT_SECRET
    },
    timestamp: new Date().toISOString()
  });
});

// Cloud Scheduler endpoint for payment reminders
// This replaces the internal cron job when running on Cloud Run
app.post('/api/scheduler/trigger', async (req, res) => {
  try {
    // Verify request is from Cloud Scheduler (optional security)
    const userAgent = req.get('User-Agent') || '';
    const isCloudScheduler = userAgent.includes('Google-Cloud-Scheduler');
    const hasSchedulerKey = req.get('X-Scheduler-Key') === process.env.SCHEDULER_SECRET;

    // Allow if from Cloud Scheduler OR has valid secret OR in development
    if (!isCloudScheduler && !hasSchedulerKey && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Unauthorized scheduler trigger attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔧 Cloud Scheduler trigger received');
    await paymentReminderScheduler.triggerCheck();

    const stats = paymentReminderScheduler.getStats();
    res.json({
      success: true,
      message: 'Payment reminder check triggered',
      stats
    });
  } catch (error) {
    console.error('Scheduler trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scheduler statistics
app.get('/api/scheduler/stats', (req, res) => {
  const stats = paymentReminderScheduler.getStats();
  res.json(stats);
});

// Manual trigger for attendance cleanup (admin only, for testing)
app.post('/api/scheduler/attendance-cleanup/trigger', async (req, res) => {
  try {
    // Verify request in production
    const userAgent = req.get('User-Agent') || '';
    const isCloudScheduler = userAgent.includes('Google-Cloud-Scheduler');
    const hasSchedulerKey = req.get('X-Scheduler-Key') === process.env.SCHEDULER_SECRET;

    // Allow if from Cloud Scheduler OR has valid secret OR in development
    if (!isCloudScheduler && !hasSchedulerKey && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Unauthorized attendance cleanup trigger attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔧 Attendance cleanup trigger received');
    await attendanceCleanupScheduler.triggerCleanup();

    const stats = attendanceCleanupScheduler.getStats();
    res.json({
      success: true,
      message: 'Attendance cleanup triggered',
      stats
    });
  } catch (error) {
    console.error('Attendance cleanup trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get attendance cleanup scheduler statistics
app.get('/api/scheduler/attendance-cleanup/stats', (req, res) => {
  const stats = attendanceCleanupScheduler.getStats();
  res.json(stats);
});

// Manual trigger for attendance location cleanup (admin only, for testing)
app.post('/api/scheduler/attendance-location-cleanup/trigger', async (req, res) => {
  try {
    // Verify request in production
    const userAgent = req.get('User-Agent') || '';
    const isCloudScheduler = userAgent.includes('Google-Cloud-Scheduler');
    const hasSchedulerKey = req.get('X-Scheduler-Key') === process.env.SCHEDULER_SECRET;

    // Allow if from Cloud Scheduler OR has valid secret OR in development
    if (!isCloudScheduler && !hasSchedulerKey && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Unauthorized attendance location cleanup trigger attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔧 Attendance location cleanup trigger received');
    const result = await attendanceLocationCleanupService.triggerCleanup();

    res.json({
      success: true,
      message: 'Attendance location cleanup triggered',
      ...result
    });
  } catch (error) {
    console.error('Attendance location cleanup trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get attendance location cleanup service statistics
app.get('/api/scheduler/attendance-location-cleanup/stats', (req, res) => {
  const stats = attendanceLocationCleanupService.getStats();
  res.json(stats);
});

// Error handler
app.use(errorHandler);

// ============================================
// PRODUCTION: Serve React build files
// ============================================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, 'client', 'build')));

  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// Socket.io events
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join user to their personal room when they send their userId
  socket.on('join-user-room', (userId) => {
    if (userId) {
      const roomName = `user:${userId}`;
      socket.join(roomName);
      console.log(`👤 Socket ${socket.id} joined room: ${roomName}`);
    }
  });

  // Leave user room
  socket.on('leave-user-room', (userId) => {
    if (userId) {
      const roomName = `user:${userId}`;
      socket.leave(roomName);
      console.log(`👋 Socket ${socket.id} left room: ${roomName}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Log configuration status for debugging
  console.log('📋 Configuration Status:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  - MongoDB URI set:', !!process.env.MONGODB_URI);
  console.log('  - MongoDB connected:', mongoose.connection.readyState === 1 ? '✅ Yes' : '❌ No');
  console.log('  - JWT Secret set:', !!process.env.JWT_SECRET);
  console.log('  - Cloudinary configured:', !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  ));
  console.log('  - Gemini API configured:', !!process.env.GEMINI_API_KEY);
  console.log('  - Vision API configured:', !!process.env.GOOGLE_VISION_API_KEY);

  // Warn about critical missing environment variables
  if (!process.env.MONGODB_URI) {
    console.error('⚠️  WARNING: MONGODB_URI not set! Authentication will fail!');
  }
  if (!process.env.JWT_SECRET) {
    console.error('⚠️  WARNING: JWT_SECRET not set! Using default secret (not secure for production)!');
  }

  // Validate Cloudinary credentials on startup
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('\n🔐 Validating Cloudinary credentials...');
    console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('  - API Key:', process.env.CLOUDINARY_API_KEY?.substring(0, 8) + '...');
    console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.substring(process.env.CLOUDINARY_API_SECRET.length - 4) : 'NOT SET');

    try {
      const cloudinary = require('./src/config/cloudinary');
      // Test credentials by calling the ping API
      const result = await cloudinary.api.ping();
      console.log('✅ Cloudinary credentials validated successfully!', result);
    } catch (error) {
      console.error('❌ Cloudinary credential validation FAILED:');
      console.error('  - Error:', error.message);
      console.error('  - HTTP Code:', error.http_code);
      console.error('  - This will cause PDF upload/download failures!');
      console.error('  - Please check your Cloudinary credentials in Google Secret Manager');
    }
  } else {
    console.log('\n⚠️  Cloudinary credentials not fully configured - PDF features may not work');
  }

  // Validate AI APIs for business card OCR
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY) {
    try {
      const { checkAllAPIs } = require('./src/utils/apiHealthCheck');
      await checkAllAPIs();
    } catch (error) {
      console.error('⚠️  API health check failed:', error.message);
    }
  }
});
