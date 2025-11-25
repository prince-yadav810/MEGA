# Cloudinary PDF Storage Fix Guide

## Problem
PDFs are saving to local storage (`/uploads/quotations/`) instead of Cloudinary, causing 404 errors on Cloud Run.

---

## Step 1: Check Current Configuration

Visit this URL in your browser (replace with your Cloud Run URL):
```
https://mega-management-411708517030.asia-south1.run.app/api/config-check
```

**Expected Response:**
```json
{
  "status": "OK",
  "config": {
    "nodeEnv": "production",
    "cloudinaryConfigured": true,  ← MUST BE TRUE
    "cloudinaryCloudName": "dgm2t...",
    "geminiConfigured": true,
    "visionConfigured": true,
    "mongodbConfigured": true,
    "clientUrl": "https://mega-management-411708517030.asia-south1.run.app",
    "jwtConfigured": true
  }
}
```

**If `cloudinaryConfigured: false`, continue to Step 2.**

---

## Step 2: Verify Secrets Exist in Google Cloud

Run this command:
```bash
gcloud secrets list --filter="name:CLOUDINARY"
```

**Expected output:**
```
NAME                      CREATED              REPLICATION_POLICY  LOCATIONS
CLOUDINARY_API_KEY       2024-11-25T...       automatic           -
CLOUDINARY_API_SECRET    2024-11-25T...       automatic           -
CLOUDINARY_CLOUD_NAME    2024-11-25T...       automatic           -
```

**If secrets don't exist, create them:**
```bash
echo -n "dgm2tjwml" | gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "416518993971149" | gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "iRy_bQfYfBZ7JHGqPImC7eZiEZE" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
```

---

## Step 3: Grant Cloud Run Access to Secrets

Get your project number:
```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"
```

Grant access to all Cloudinary secrets:
```bash
for SECRET in CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Step 4: Verify cloudbuild.yaml Has Secrets Configuration

Check that `cloudbuild.yaml` line 67-68 is NOT commented:
```yaml
- '--set-secrets'
- 'MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_VISION_API_KEY=GOOGLE_VISION_API_KEY:latest,CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest'
```

---

## Step 5: Redeploy to Cloud Run

```bash
cd "/Users/krishnasoni/Documents/3D Object/SAAS/Mega/MEGA/mega-management-system"
gcloud builds submit --config cloudbuild.yaml
```

Wait for deployment to complete (5-10 minutes).

---

## Step 6: Verify Configuration After Deployment

Visit the config check URL again:
```
https://mega-management-411708517030.asia-south1.run.app/api/config-check
```

**Verify:**
- ✅ `cloudinaryConfigured: true`
- ✅ `cloudinaryCloudName: "dgm2t..."` (NOT "NOT SET")

---

## Step 7: Test PDF Upload

1. Go to your production website
2. Upload a new Excel quotation
3. **Check Cloud Run logs:**
   ```bash
   gcloud run services logs read mega-management --region=asia-south1 --limit=50
   ```

**Look for these logs:**
```
☁️  Cloudinary configured: true
☁️  Uploading PDF to Cloudinary...
✅ PDF uploaded to Cloudinary: https://res.cloudinary.com/dgm2tjwml/...
```

**If you see:**
```
⚠️  Cloudinary NOT configured:
  hasCloudName: false
  hasApiKey: false
  hasApiSecret: false
```
→ Secrets are not loading. Go back to Step 3.

---

## Step 8: Test PDF Download

1. Open any quotation in your production website
2. Click "Download PDF"
3. **Expected:** PDF downloads from Cloudinary URL
4. **Check browser Network tab:**
   - Request: `GET /api/quotations/{id}/download`
   - Response: `{ "success": true, "isExternal": true, "downloadUrl": "https://res.cloudinary.com/..." }`

**If you still get 404:**
- Old quotations have local paths
- Click "Regenerate PDF" button
- PDF will auto-upload to Cloudinary

---

## Step 9: Test Auto-Regeneration

1. Open an old quotation (with local path)
2. **Expected:** Loading spinner → "PDF regenerated and uploaded to cloud"
3. PDF displays in iframe

---

## Troubleshooting

### Problem: `cloudinaryConfigured: false`

**Check secrets access:**
```bash
gcloud secrets get-iam-policy CLOUDINARY_CLOUD_NAME
```

**Should show:**
```yaml
bindings:
- members:
  - serviceAccount:411708517030-compute@developer.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

### Problem: Still saving locally after deployment

**Check logs during upload:**
```bash
gcloud run services logs read mega-management --region=asia-south1 --limit=100 | grep -i cloudinary
```

**Should see:**
```
☁️  Cloudinary configured: true
☁️  Uploading PDF to Cloudinary...
✅ PDF uploaded to Cloudinary
```

### Problem: 404 on download

**Check quotation in database:**
```bash
# The pdfUrl should start with https://res.cloudinary.com/
```

**If it's `/uploads/quotations/...`:**
- Click "Regenerate PDF" button in UI
- OR call: `POST /api/quotations/{id}/regenerate-pdf`

---

## Quick Commands Reference

```bash
# Check config
curl https://mega-management-411708517030.asia-south1.run.app/api/config-check

# View logs
gcloud run services logs read mega-management --region=asia-south1 --limit=50

# Check secrets
gcloud secrets list --filter="name:CLOUDINARY"

# Grant access to secrets
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
for SECRET in CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done

# Redeploy
gcloud builds submit --config cloudbuild.yaml
```

---

## Expected Behavior After Fix

1. **New quotations:** PDFs automatically upload to Cloudinary
2. **Old quotations:** Auto-regenerate on first view
3. **Download:** Works from Cloudinary URL
4. **Preview:** Displays in iframe from Cloudinary

---

## Contact/Debug

If issues persist after following all steps, check:
1. Config check endpoint shows `cloudinaryConfigured: true`
2. Logs show "Uploading PDF to Cloudinary..."
3. Database `pdfUrl` field starts with `https://res.cloudinary.com/`
