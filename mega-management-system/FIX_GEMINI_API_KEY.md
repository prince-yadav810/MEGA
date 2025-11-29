# Fix: Business Card OCR - Missing GEMINI_API_KEY

## Problem
The business card extraction feature is failing with:
```
API Key not found. Please pass a valid API key.
```

This is because the `GEMINI_API_KEY` environment variable is not set in your Cloud Run deployment.

## Solution

### Step 1: Create Secret in Google Cloud Secret Manager

```bash
# Set your project ID (replace with your actual project ID)
gcloud config set project mega-management-2024

# Create the GEMINI_API_KEY secret
# Replace 'YOUR_ACTUAL_GEMINI_API_KEY' with your real API key
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# OR if the secret already exists, update it:
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Step 2: Grant Cloud Run Access to the Secret

```bash
# Get your Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe mega-management \
  --region asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)')

# If the above returns empty, use the default service account:
PROJECT_NUMBER=$(gcloud projects describe mega-management-2024 --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Update Cloud Run Service to Use the Secret

```bash
gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Step 4: Verify the Deployment

```bash
# Check if the secret is properly configured
gcloud run services describe mega-management \
  --region asia-south1 \
  --format='yaml(spec.template.spec.containers[0].env)'
```

You should see `GEMINI_API_KEY` in the list of environment variables.

### Step 5: Test the Feature

1. Go to your application: https://mega-management-411708517030.asia-south1.run.app/clients
2. Click "Add New Client" → "Scan Business Card"
3. Upload a business card image
4. Click "Extract Information"
5. It should now work! ✅

---

## Additional Secrets You May Need

If you haven't already, you should also create these secrets:

### Google Vision API Key (for OCR)
```bash
echo -n "YOUR_GOOGLE_VISION_API_KEY" | gcloud secrets create GOOGLE_VISION_API_KEY --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding GOOGLE_VISION_API_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run
gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets GOOGLE_VISION_API_KEY=GOOGLE_VISION_API_KEY:latest
```

### MongoDB URI
```bash
echo -n "mongodb+srv://username:password@cluster.mongodb.net/mega-management" | gcloud secrets create MONGODB_URI --data-file=-

gcloud secrets add-iam-policy-binding MONGODB_URI \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets MONGODB_URI=MONGODB_URI:latest
```

### JWT Secret
```bash
# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets JWT_SECRET=JWT_SECRET:latest
```

### Cloudinary Credentials
```bash
echo -n "your_cloud_name" | gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "your_api_key" | gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "your_api_secret" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding CLOUDINARY_CLOUD_NAME --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding CLOUDINARY_API_KEY --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding CLOUDINARY_API_SECRET --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"

# Update Cloud Run
gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

---

## Quick Command to Set All Secrets at Once

```bash
# Update Cloud Run with all secrets at once
gcloud run services update mega-management \
  --region asia-south1 \
  --update-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_VISION_API_KEY=GOOGLE_VISION_API_KEY:latest,MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

---

## Troubleshooting

### Check Current Secrets
```bash
# List all secrets
gcloud secrets list

# Check if secret exists
gcloud secrets describe GEMINI_API_KEY

# View secret value (use carefully!)
gcloud secrets versions access latest --secret="GEMINI_API_KEY"
```

### Check Cloud Run Logs
```bash
# Real-time logs
gcloud beta logging tail

# Or specific service logs
gcloud run services logs read mega-management --region asia-south1 --limit 50
```

### Verify Secret is Mounted
```bash
gcloud run services describe mega-management \
  --region asia-south1 \
  --format='get(spec.template.spec.containers[0].env)'
```

---

## Where to Get Your API Keys

### Gemini API Key
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Copy your API key

### Google Vision API Key
1. Go to https://console.cloud.google.com/
2. Enable Cloud Vision API
3. Go to "APIs & Services" → "Credentials"
4. Create API key
5. Copy your API key

---

## Important Notes

- ✅ Secrets are more secure than environment variables
- ✅ Your cloudbuild.yaml is already configured to use secrets
- ✅ Secrets are encrypted at rest and in transit
- ✅ Don't commit API keys to git
- ✅ After updating secrets, Cloud Run will automatically redeploy

---

**Last Updated:** November 27, 2025



