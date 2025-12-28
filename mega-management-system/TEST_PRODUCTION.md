# Test Push Notifications in Production

## 🌐 Use Your Custom Domain

**Production URL:** https://app.megaenterprise.in

**Why use custom domain:**
- ✅ Better for testing (same as users will use)
- ✅ HTTPS already configured
- ✅ Service worker works on custom domain
- ✅ Push notifications work on any HTTPS domain

## 🧪 Testing Steps

### Step 1: Open Production URL
Go to: **https://app.megaenterprise.in**

### Step 2: Verify Service Worker
1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Should see service worker registered from `app.megaenterprise.in`

### Step 3: Grant Permission & Subscribe
1. **Log in** to the app
2. **Grant notification permission** when prompted
3. Check console: `✅ Push notifications subscribed`

### Step 4: Test Notification
1. **Create a task or client**
2. **Watch for:**
   - Native notification popup appears
   - Server logs: `📱 Push notification sent to X device(s)`

## ✅ Verify Deployment

### Check API Endpoint:
```bash
curl https://app.megaenterprise.in/api/push/vapid-public-key
```

Should return:
```json
{"success":true,"publicKey":"BOCd8xed0krI..."}
```

### Check Cloud Run Logs:
```bash
gcloud run services logs read mega-management --region asia-south1 --limit 50
```

Look for:
- `✅ VAPID keys initialized for push notifications`
- `📱 Push notification sent to X device(s)`

## 📱 Mobile Testing

1. Open **https://app.megaenterprise.in** on mobile
2. Add to home screen (PWA install)
3. Grant notification permission
4. Create a notification
5. Should receive native notification!

## 🎯 Expected Results

**On Login:**
- Permission prompt (if not granted)
- Auto-subscription
- Console: `✅ Push notifications subscribed`

**On Notification Creation:**
- Native notification popup
- Works even when app is closed
- Clicking opens the app

---

**Test on: https://app.megaenterprise.in** 🚀

