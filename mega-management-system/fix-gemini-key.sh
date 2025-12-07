#!/bin/bash

# ============================================
# Quick Fix: Add GEMINI_API_KEY to Cloud Run
# ============================================

set -e  # Exit on error

echo "🔧 Fixing GEMINI_API_KEY for Cloud Run..."
echo ""

# Set project
PROJECT_ID="mega-management-2024"
SERVICE_NAME="mega-management"
REGION="asia-south1"

echo "📦 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Prompt for API key
echo ""
echo "📝 Please enter your Gemini API Key:"
echo "   (Get it from: https://ai.google.dev/)"
read -s GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
  echo "❌ Error: API key cannot be empty"
  exit 1
fi

# Create or update secret
echo ""
echo "🔐 Creating/updating GEMINI_API_KEY secret..."
if gcloud secrets describe GEMINI_API_KEY &>/dev/null; then
  echo "   Secret exists, adding new version..."
  echo -n "$GEMINI_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
else
  echo "   Creating new secret..."
  echo -n "$GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
fi

# Get service account
echo ""
echo "🔍 Getting Cloud Run service account..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "   Service Account: $SERVICE_ACCOUNT"

# Grant access
echo ""
echo "🔓 Granting service account access to secret..."
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

# Update Cloud Run service
echo ""
echo "🚀 Updating Cloud Run service..."
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --quiet

# Verify
echo ""
echo "✅ Done! Verifying configuration..."
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format='value(spec.template.spec.containers[0].env)' | grep -i gemini || echo "   ⚠️  GEMINI_API_KEY not found in env vars (this might be normal if using secrets)"

echo ""
echo "🎉 GEMINI_API_KEY has been configured!"
echo ""
echo "📋 Next steps:"
echo "   1. Wait 10-20 seconds for Cloud Run to redeploy"
echo "   2. Go to: https://mega-management-411708517030.asia-south1.run.app/clients"
echo "   3. Try uploading a business card again"
echo ""
echo "📊 Monitor logs with:"
echo "   gcloud beta logging tail"
echo ""






