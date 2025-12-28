#!/bin/bash
# Deployment script for Push Notifications

set -e

echo "🚀 Deploying Push Notifications to Production..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
echo "📋 Current Project: $PROJECT_ID"
echo ""

# VAPID Keys
VAPID_PUBLIC_KEY="BOCd8xed0krI_lWEMfjfjnp086dh3Cos_oIwgMI6dul-B1j7_4nxqJ7NBzx3XpGsL2fzfGrcWWnltIqMVBFa5c0"
VAPID_PRIVATE_KEY="9Co02AlPKTs4lQibWxpyALhVYht5e3tE8INuxmeN7Fs"
VAPID_EMAIL="mailto:admin@megaenterprise.in"

echo "1️⃣  Adding VAPID keys to Cloud Run..."
echo ""

# Update Cloud Run service with VAPID keys
gcloud run services update mega-management \
  --region asia-south1 \
  --update-env-vars VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY,VAPID_EMAIL=$VAPID_EMAIL \
  --quiet

echo "✅ VAPID keys added to Cloud Run"
echo ""

echo "2️⃣  Deploying code with Cloud Build..."
echo ""

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Check Cloud Run logs for: '✅ VAPID keys initialized'"
echo "   2. Test on production URL"
echo "   3. Grant notification permission"
echo "   4. Create a task/client to test push notifications"
echo ""
