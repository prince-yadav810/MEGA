// File path: server/server.js

// Load env vars FIRST before any other imports that depend on them
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const notesRoutes = require('./src/routes/notes');
const remindersRoutes = require('./src/routes/reminders');
const callLogRoutes = require('./src/routes/callLogRoutes');
const paymentReminderScheduler = require('./src/services/paymentReminderScheduler');

// Connect to database
connectDB();

// Start Payment Reminder Scheduler
// In Cloud Run: Set DISABLE_CRON=true and use Cloud Scheduler instead
const DISABLE_CRON = process.env.DISABLE_CRON === 'true';

if (!DISABLE_CRON) {
  setTimeout(() => {
    paymentReminderScheduler.start();
  }, 5000); // Wait 5 seconds after server start to ensure DB is connected
} else {
  console.log('⚠️  Internal cron disabled. Use /api/scheduler/trigger endpoint for Cloud Scheduler.');
}

const app = express();
const server = http.createServer(app);
// Get client URL - require in production
const getClientUrl = () => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  WARNING: CLIENT_URL not set in production! CORS may block requests.');
    // In production, also allow the origin from the request header
    return true; // This enables CORS for all origins - configure CLIENT_URL for security
  }
  return "http://localhost:3000";
};

const clientUrl = getClientUrl();

const io = socketIo(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"]
  }
});

// ⭐ CORS must load first
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ⭐ YOUR express-fileupload middleware
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded',
    createParentPath: true
  })
);

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
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/api-usage', require('./src/routes/apiUsage'));
app.use('/api/call-logs', callLogRoutes);
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/whatsapp', require('./src/routes/whatsapp'));

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
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Log configuration status for debugging
  console.log('📋 Configuration Status:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  - Cloudinary configured:', !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  ));
  console.log('  - Gemini API configured:', !!process.env.GEMINI_API_KEY);
  console.log('  - Vision API configured:', !!process.env.GOOGLE_VISION_API_KEY);
  console.log('  - MongoDB URI set:', !!process.env.MONGODB_URI);
});
