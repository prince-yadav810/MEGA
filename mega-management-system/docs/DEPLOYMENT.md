# MEGA Management System - Production Deployment Guide

## Pre-Deployment Checklist

Before deploying, ensure you have configured ALL of the following:

### 1. Required API Keys

| Service | Environment Variable | Where to Get It | Required For |
|---------|---------------------|-----------------|--------------|
| MongoDB Atlas | `MONGODB_URI` | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) | Database |
| Google Vision | `GOOGLE_VISION_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) | Card text extraction |
| Gemini AI | `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/app/apikey) | AI data parsing |
| Cloudinary | `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) | Image/PDF storage |

### 2. Environment Variables

Set these in your hosting platform (Cloud Run, Vercel, etc.):

```bash
# Required
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://...your-connection-string...
CLIENT_URL=https://your-production-domain.com
JWT_SECRET=your-secure-random-secret

# AI Features (Required for card extraction)
GOOGLE_VISION_API_KEY=your-key
GEMINI_API_KEY=your-key

# Storage (Required for images/PDFs)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Cloud Run specific
DISABLE_CRON=true
SCHEDULER_SECRET=your-scheduler-secret
```

## Setting Up External Services

### MongoDB Atlas

1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user with password
4. Whitelist IP addresses (or use 0.0.0.0/0 for Cloud Run)
5. Get connection string from "Connect" ’ "Connect your application"

### Google Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Cloud Vision API" from API Library
4. Go to Credentials ’ Create API Key
5. (Optional) Restrict API key to Cloud Vision API only

### Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key - it's free with generous limits

### Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret

## Deployment Options

### Option 1: Google Cloud Run (Recommended)

```bash
# Build and deploy
gcloud run deploy mega-management \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=...,CLIENT_URL=..."
```

### Option 2: Docker

```bash
# Build image
docker build -t mega-management .

# Run container
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your-uri \
  -e CLIENT_URL=your-domain \
  mega-management
```

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

1. Clone repository
2. Install Node.js 18+
3. Copy `.env.example` to `.env` and fill in values
4. Run `npm install` in both `/server` and `/client`
5. Build client: `cd client && npm run build`
6. Use PM2 or systemd to run: `pm2 start server/server.js`

## Troubleshooting

### Features Not Working

| Feature | Required Variables | Error Message |
|---------|-------------------|---------------|
| Business card extraction | `GOOGLE_VISION_API_KEY` | "Failed to extract text from image" |
| AI card parsing | `GEMINI_API_KEY` | "Failed to parse business card text" |
| PDF generation | `CLOUDINARY_*` | PDF files disappear/can't be downloaded |
| Image uploads | `CLOUDINARY_*` | "Failed to upload image" |
| API requests blocked | `CLIENT_URL` | CORS errors in browser console |

### Common Issues

1. **CORS errors**: Set `CLIENT_URL` to your exact frontend domain (with https://)
2. **PDF files missing**: Configure Cloudinary credentials
3. **Database connection failed**: Check MongoDB URI and IP whitelist
4. **AI features not working**: Verify API keys are correct and have quota

## Security Notes

1. Never commit `.env` files to git
2. Use strong, random `JWT_SECRET` (at least 32 characters)
3. Rotate Twilio credentials if exposed
4. Set up API key restrictions in Google Cloud Console
