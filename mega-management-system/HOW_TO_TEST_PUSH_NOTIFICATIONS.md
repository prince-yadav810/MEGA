# How to Test & Verify Push Notifications

## Quick Test Steps

### 1. Check if You're Subscribed

**In Browser Console (F12):**
```javascript
// Check service worker
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    if (sub) {
      console.log('✅ Subscribed!', sub.endpoint);
    } else {
      console.log('❌ Not subscribed');
    }
  });
});
```

**Or check in DevTools:**
- Open DevTools (F12)
- Go to **Application** tab
- Click **Service Workers** → Should see service worker running
- Click **Push** → Should see subscription endpoint

---

### 2. Check Server Logs

When you create a notification, you should see:

**Success:**
```
📱 Push notification sent to 1/1 device(s) for user [userId]
```

**If not subscribed:**
```
(No message - silently skipped)
```

**If error:**
```
⚠️  Error sending push...
```

---

### 3. Test Notification Creation

**Method 1: Create a Task**
1. Go to Tasks/Workspace
2. Create a new task
3. Assign it to yourself
4. You should receive a push notification

**Method 2: Create a Client**
1. Go to Clients
2. Create a new client
3. You should receive a notification

**Method 3: Check Inbox**
1. Go to Inbox
2. You should see the notification there
3. If push worked, you also got a native notification

---

### 4. Check Browser Notifications

**When App is OPEN:**
- Notification appears in browser's notification area (top-right)
- Click it to open the app

**When App is CLOSED:**
- Native notification appears on your device
- Click it to open the app
- Works like WhatsApp/Snapchat notifications!

---

### 5. Verify in Database

**Check if subscription exists:**
```bash
# In MongoDB
db.pushsubscriptions.find({ userId: ObjectId("your-user-id") })
```

**Should see:**
```json
{
  "_id": "...",
  "userId": "...",
  "endpoint": "https://...",
  "keys": { "p256dh": "...", "auth": "..." },
  "createdAt": "..."
}
```

---

## Step-by-Step Testing Guide

### Step 1: Verify Subscription

1. **Open Browser Console (F12)**
2. **Check subscription:**
   ```javascript
   navigator.serviceWorker.ready
     .then(reg => reg.pushManager.getSubscription())
     .then(sub => console.log('Subscription:', sub ? '✅ Yes' : '❌ No'));
   ```

3. **Expected:** `Subscription: ✅ Yes`

---

### Step 2: Check Server Status

1. **Look at server logs when starting:**
   ```
   ✅ VAPID keys initialized for push notifications
   ```

2. **If you see:**
   ```
   ⚠️  VAPID keys not configured
   ```
   → Add keys to `.env` and restart server

---

### Step 3: Create a Test Notification

1. **Create a task or client**
2. **Watch server logs:**
   ```
   📬 Notification sent to user:...
   📱 Push notification sent to 1/1 device(s) for user...
   ```

3. **If you see:**
   ```
   📱 Push notification sent to 0/1 device(s)
   ```
   → You're not subscribed (refresh and log in again)

---

### Step 4: Check Notification Delivery

**On Desktop (Chrome/Firefox):**
- Notification appears in top-right corner
- Click to open app

**On Mobile (iOS/Android):**
- Native notification appears
- Swipe down to see it
- Tap to open app

**If notification doesn't appear:**
- Check browser notification settings
- Check if "Do Not Disturb" is on
- Check if notifications are blocked for the site

---

## Troubleshooting Checklist

### ✅ Subscription Check

**In Browser Console:**
```javascript
// Run this in console
(async () => {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  console.log('Subscribed:', !!sub);
  if (sub) {
    console.log('Endpoint:', sub.endpoint.substring(0, 50) + '...');
  }
})();
```

**Expected Output:**
```
Subscribed: true
Endpoint: https://fcm.googleapis.com/fcm/send/...
```

---

### ✅ Server Check

**In Server Logs:**
```
✅ VAPID keys initialized for push notifications
```

**When creating notification:**
```
📱 Push notification sent to 1/1 device(s) for user...
```

---

### ✅ Browser Check

**DevTools → Application:**
- Service Workers: ✅ Activated
- Push: ✅ Subscription exists
- Notifications: ✅ Permission granted

---

### ✅ Notification Test

1. **Create a notification** (task/client)
2. **Check:**
   - ✅ Server logs show "Push notification sent"
   - ✅ Browser notification appears
   - ✅ Inbox shows the notification

---

## Quick Test Script

**Paste this in Browser Console (F12):**

```javascript
// Complete push notification test
(async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...\n');
  
  // 1. Check service worker
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker not supported');
    return;
  }
  console.log('✅ Service Worker supported');
  
  // 2. Check service worker registration
  try {
    const reg = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');
  } catch (e) {
    console.log('❌ Service Worker not ready:', e);
    return;
  }
  
  // 3. Check push subscription
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  
  if (sub) {
    console.log('✅ Push subscription exists');
    console.log('   Endpoint:', sub.endpoint.substring(0, 60) + '...');
  } else {
    console.log('❌ No push subscription');
    console.log('   → Refresh page and log in again');
    return;
  }
  
  // 4. Check notification permission
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission granted');
  } else {
    console.log('❌ Notification permission:', Notification.permission);
  }
  
  // 5. Test notification display
  if (Notification.permission === 'granted') {
    new Notification('Test Notification', {
      body: 'If you see this, notifications work!',
      icon: '/logo192.png'
    });
    console.log('✅ Test notification sent');
  }
  
  console.log('\n✅ All checks passed! Push notifications should work.');
})();
```

**Expected Output:**
```
🧪 Testing Push Notifications...

✅ Service Worker supported
✅ Service Worker ready
✅ Push subscription exists
   Endpoint: https://fcm.googleapis.com/fcm/send/...
✅ Notification permission granted
✅ Test notification sent

✅ All checks passed! Push notifications should work.
```

---

## What to Look For

### ✅ Success Indicators:

1. **Browser Console:**
   - `✅ Push notifications subscribed`
   - No errors

2. **Server Logs:**
   - `✅ VAPID keys initialized`
   - `📱 Push notification sent to X device(s)`

3. **Browser:**
   - Notification appears
   - Clicking opens the app

4. **DevTools:**
   - Service Worker: Activated
   - Push: Subscription exists
   - Notifications: Allowed

### ❌ Failure Indicators:

1. **No subscription:**
   - `❌ No push subscription` in console
   - Solution: Refresh and log in again

2. **Permission denied:**
   - `Notification permission: denied`
   - Solution: Enable in browser settings

3. **VAPID keys missing:**
   - `⚠️ VAPID keys not configured` in server
   - Solution: Add keys to `.env` and restart

---

## Real-World Test

**Best way to test:**

1. **Open your app** in browser
2. **Log in**
3. **Open another tab** or **minimize browser**
4. **Create a notification** (task/client) from another account or admin
5. **You should see:**
   - Native notification appears
   - Clicking it opens the app
   - Works even if browser is closed!

---

## Summary

**To check if you got a notification:**

1. ✅ **Look for native notification** (browser/system notification)
2. ✅ **Check server logs** (`📱 Push notification sent`)
3. ✅ **Check browser console** (no errors)
4. ✅ **Check DevTools** (subscription exists)
5. ✅ **Check Inbox** (notification appears there)

**If you see the notification popup, it's working!** 🎉

