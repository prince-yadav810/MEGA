# Check Push Notification Status

## Current Status

✅ Service Worker: Registered
✅ App: Working (tasks created)
❓ Push Subscription: Need to check

## Quick Check - Paste in Console (F12)

```javascript
// Complete push notification status check
(async () => {
  console.log('🔍 Checking Push Notification Status...\n');
  
  // 1. Check service worker
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker: Ready');
    console.log('   Scope:', reg.scope);
  } else {
    console.log('❌ Service Worker: Not supported');
    return;
  }
  
  // 2. Check subscription
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  
  if (sub) {
    console.log('✅ Push Subscription: Active');
    console.log('   Endpoint:', sub.endpoint.substring(0, 60) + '...');
  } else {
    console.log('❌ Push Subscription: Not subscribed');
    console.log('   → Need to subscribe');
  }
  
  // 3. Check permission
  if ('Notification' in window) {
    console.log('📱 Notification Permission:', Notification.permission);
    if (Notification.permission !== 'granted') {
      console.log('   ⚠️  Permission not granted - need to enable');
    }
  }
  
  // 4. Try to subscribe if not subscribed
  if (!sub && Notification.permission === 'granted') {
    console.log('\n🔄 Attempting to subscribe...');
    try {
      // Get VAPID key from server
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();
      
      if (publicKey) {
        // Convert key
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        
        // Send to backend
        const subObj = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        };
        
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(subObj)
        });
        
        console.log('✅ Subscription successful!');
      }
    } catch (error) {
      console.error('❌ Subscription failed:', error.message);
    }
  }
  
  console.log('\n✅ Check complete!');
})();
```

## What to Look For

### ✅ Good Status:
```
✅ Service Worker: Ready
✅ Push Subscription: Active
📱 Notification Permission: granted
```

### ❌ Issues:
- **Not subscribed**: Run the script above to subscribe
- **Permission denied**: Enable in browser settings
- **No service worker**: Refresh page

## After Running Script

1. **If subscribed**: Create a task and watch for notification
2. **Check server logs**: Should see `📱 Push notification sent to 1/1 device(s)`
3. **Watch browser**: Notification popup should appear

## Test Notification

After subscribing, create a task and you should see:
- Server: `📱 Push notification sent to 1/1 device(s)`
- Browser: Native notification popup
- Console: `Service Worker: ✅ Notification shown successfully`

