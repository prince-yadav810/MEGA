# MEGA Management System - Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Download](https://cloud.google.com/sdk/docs/install))
3. **MongoDB Atlas** account (free tier works)
4. **Cloudinary** account (already configured in your app)

---

## Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create mega-management-prod --name="MEGA Management"

# Set the project as active
gcloud config set project mega-management-prod

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## Step 2: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Create a database user (save username/password)
4. Add `0.0.0.0/0` to IP whitelist (allows Cloud Run access)
5. Get connection string: `mongodb+srv://<user>:<pass>@cluster.xxx.mongodb.net/mega_management`

---

## Step 3: Deploy to Cloud Run

### Option A: Quick Deploy (Recommended)

```bash
# Navigate to project directory
cd mega-management-system

# Deploy with source (Cloud Build will build automatically)
gcloud run deploy mega-management \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 300 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,DISABLE_CRON=true"
```

### Option B: Using Cloud Build (For CI/CD)

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## Step 4: Configure Environment Variables

After deployment, set environment variables in Cloud Run console or via CLI:

```bash
gcloud run services update mega-management \
  --region asia-south1 \
  --set-env-vars "\
NODE_ENV=production,\
PORT=8080,\
MONGODB_URI=mongodb+srv://user:pass@cluster.xxx.mongodb.net/mega_management,\
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long,\
JWT_EXPIRE=7d,\
DISABLE_CRON=true,\
SCHEDULER_SECRET=your-scheduler-secret-key,\
CLOUDINARY_CLOUD_NAME=your-cloud-name,\
CLOUDINARY_API_KEY=your-api-key,\
CLOUDINARY_API_SECRET=your-api-secret,\
WHATSAPP_PROVIDER=twilio,\
TWILIO_ACCOUNT_SID=your-account-sid,\
TWILIO_AUTH_TOKEN=your-auth-token,\
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886,\
COMPANY_NAME=MEGA Enterprises,\
COMPANY_PHONE=+91-XXXXXXXXXX"
```

---

## Step 5: Set Up Cloud Scheduler (Replaces node-cron)

Create a Cloud Scheduler job to trigger payment reminders every 5 minutes:

```bash
# Get your Cloud Run service URL
SERVICE_URL=$(gcloud run services describe mega-management --region asia-south1 --format 'value(status.url)')

# Create scheduler job
gcloud scheduler jobs create http payment-reminder-scheduler \
  --location asia-south1 \
  --schedule "*/5 * * * *" \
  --uri "${SERVICE_URL}/api/scheduler/trigger" \
  --http-method POST \
  --headers "Content-Type=application/json,X-Scheduler-Key=your-scheduler-secret-key" \
  --time-zone "Asia/Kolkata" \
  --attempt-deadline 180s
```

---

## Step 6: Verify Deployment

```bash
# Get service URL
gcloud run services describe mega-management --region asia-south1 --format 'value(status.url)'

# Test health endpoint
curl https://your-service-url.run.app/api/health

# Test scheduler endpoint (manual trigger)
curl -X POST https://your-service-url.run.app/api/scheduler/trigger \
  -H "X-Scheduler-Key: your-scheduler-secret-key"
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Set to `8080` (Cloud Run default) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens (min 32 chars) |
| `JWT_EXPIRE` | No | Token expiry (default: 7d) |
| `DISABLE_CRON` | Yes | Set to `true` for Cloud Run |
| `SCHEDULER_SECRET` | Yes | Secret for Cloud Scheduler auth |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `WHATSAPP_PROVIDER` | No | `twilio` or `mock` |
| `TWILIO_ACCOUNT_SID` | If using Twilio | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | If using Twilio | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | If using Twilio | Twilio WhatsApp number |
| `COMPANY_NAME` | No | Company name for messages |
| `COMPANY_PHONE` | No | Company phone for messages |

---

## Cost Optimization Tips

### 1. Scale to Zero (Already Configured)
```bash
--min-instances 0  # No cost when idle
```

### 2. Limit Max Instances
```bash
--max-instances 3  # Prevents cost spikes
```

### 3. Use Mumbai Region (Closest to India)
```bash
--region asia-south1
```

### 4. Monitor Usage
```bash
# View Cloud Run metrics
gcloud run services describe mega-management --region asia-south1
```

---

## Estimated Monthly Costs

| Traffic | Compute | MongoDB Atlas | Total |
|---------|---------|---------------|-------|
| Low (< 50 users/day) | ₹0-500 | ₹0 (M0 free) | ₹0-500 |
| Medium (50-200 users/day) | ₹500-1,500 | ₹0-800 | ₹500-2,300 |
| High (200+ users/day) | ₹1,500-3,000 | ₹800-2,000 | ₹2,300-5,000 |

---

## Troubleshooting

### Build Fails
```bash
# Check build logs
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

### App Crashes
```bash
# Check Cloud Run logs
gcloud run services logs read mega-management --region asia-south1 --limit 50
```

### Database Connection Issues
- Ensure MongoDB Atlas allows `0.0.0.0/0` IP
- Check connection string format
- Verify user credentials

### Scheduler Not Running
```bash
# Check scheduler job status
gcloud scheduler jobs describe payment-reminder-scheduler --location asia-south1

# View scheduler logs
gcloud scheduler jobs list --location asia-south1
```

---

## Updating the Application

```bash
# Deploy new version
gcloud run deploy mega-management \
  --source . \
  --region asia-south1

# Or use Cloud Build for CI/CD
gcloud builds submit --config cloudbuild.yaml
```

---

## Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service mega-management \
  --domain your-domain.com \
  --region asia-south1
```

Follow DNS configuration instructions provided by GCP.

---

## Support

For issues, check:
1. Cloud Run logs: `gcloud run services logs read mega-management`
2. Cloud Build logs: `gcloud builds list`
3. MongoDB Atlas logs (Atlas console)
