# Environment Variables Template

Copy these variables to your `/server/.env` file and fill in your values.

```env
# ============================================
# MEGA Management System - Environment Variables
# ============================================

# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=5000

# ============================================
# Database
# ============================================
MONGODB_URI=mongodb://localhost:27017/mega-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mega-management?retryWrites=true&w=majority

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# ============================================
# Client URL (Frontend)
# ============================================
CLIENT_URL=http://localhost:3000

# ============================================
# WhatsApp Payment Reminder Configuration
# ============================================

# WhatsApp Provider
# Options: 'mock' (testing, no real messages) or 'twilio' (production)
WHATSAPP_PROVIDER=mock

# Twilio Configuration (only needed if WHATSAPP_PROVIDER=twilio)
# Get these from: https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# Twilio WhatsApp Number
# For Sandbox Testing: whatsapp:+14155238886
# For Production: whatsapp:+919876543210 (your verified business number)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Company Information (used in message templates)
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890

# ============================================
# Cloudinary (for file uploads)
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ============================================
# Email Configuration (optional)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=MEGA Enterprises <noreply@megaenterprises.com>

# ============================================
# Google Cloud (for OCR/Vision API - optional)
# ============================================
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# ============================================
# Gemini AI (for AI features - optional)
# ============================================
GEMINI_API_KEY=your_gemini_api_key

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# File Upload Limits
# ============================================
MAX_FILE_SIZE=10485760
# 10MB = 10485760 bytes
```

## Quick Start for WhatsApp Testing

### Option 1: Mock Mode (No API, Immediate Testing)
Add these to your `.env`:
```env
WHATSAPP_PROVIDER=mock
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890
```

### Option 2: Twilio Sandbox (FREE Real WhatsApp Testing)
1. Sign up at https://www.twilio.com/try-twilio
2. Get your credentials from console
3. Add to `.env`:
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890
```
4. Join sandbox: Send "join [code]" to +1 415 523 8886 on WhatsApp

See `WHATSAPP_PAYMENT_REMINDER_SETUP.md` for detailed setup instructions!


