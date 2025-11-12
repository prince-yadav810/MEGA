// File path: server/server.js
// REPLACE entire file with this

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const notesRoutes = require('./src/routes/notes');
const remindersRoutes = require('./src/routes/reminders');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ⭐ IMPORTANT: CORS MUST BE FIRST - BEFORE ANY ROUTES
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// Socket.io middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ⭐ ROUTES - After middleware
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
app.use('/api/api-usage', require('./src/routes/apiUsage')); // Business Card OCR API usage tracking

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MEGA Management Server is running' });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});