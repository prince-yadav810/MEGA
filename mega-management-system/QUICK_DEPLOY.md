# Quick Deploy Push Notifications

## Option 1: Automated Script (Easiest)

```bash
./deploy-push.sh
```

This will:
1. Add VAPID keys to Cloud Run
2. Deploy code using Cloud Build

## Option 2: Manual Steps

### Step 1: Add VAPID Keys to Cloud Run

```bash
gcloud run services update mega-management \
  --region asia-south1 \
  --update-env-vars VAPID_PUBLIC_KEY=BOCd8xed0krI_lWEMfjfjnp086dh3Cos_oIwgMI6dul-B1j7_4nxqJ7NBzx3XpGsL2fzfGrcWWnltIqMVBFa5c0,VAPID_PRIVATE_KEY=9Co02AlPKTs4lQibWxpyALhVYht5e3tE8INuxmeN7Fs,VAPID_EMAIL=mailto:admin@megaenterprise.in
```

### Step 2: Deploy Code

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Option 3: Via Google Cloud Console

1. Go to: https://console.cloud.google.com/run
2. Click `mega-management` service
3. Click "Edit & Deploy New Revision"
4. Add environment variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL`
5. Click "Deploy"
6. Then deploy code via Cloud Build

## Verify Deployment

After deployment, check logs:
```bash
gcloud run services logs read mega-management --region asia-south1 --limit 50
```

Look for: `✅ VAPID keys initialized for push notifications`

