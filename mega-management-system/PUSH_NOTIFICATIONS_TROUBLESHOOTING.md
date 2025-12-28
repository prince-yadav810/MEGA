# Push Notifications Troubleshooting Guide

## Common Issues & Solutions

### Issue: 401 Unauthorized Error

**Error Message:**
```
⚠️  Unauthorized push subscription (401) - removing: https://wns2-pn1p.notify.windows.com/...
```

**Cause:**
- Subscription was created **before** VAPID keys were added to `.env`
- Subscription was created with **different** VAPID keys
- VAPID keys were changed after subscription was created

**Solution:**
1. **Refresh the browser page** (or restart the app)
2. **Log out and log back in** (this will trigger re-subscription)
3. The old invalid subscription will be automatically removed
4. A new subscription will be created with the correct VAPID keys

**Why this happens:**
- Push subscriptions are tied to the VAPID public key
- If keys change or weren't set when subscribing, the push service rejects it with 401
- This is **normal behavior** and the system handles it correctly

---

### Issue: Push Notifications Not Working on Localhost

**Question:** Does localhost cause push notification errors?

**Answer:** **NO!** Localhost works perfectly fine for push notifications.

- ✅ Push notifications work on `http://localhost`
- ✅ Service workers work on localhost
- ✅ No special configuration needed

**If you see errors on localhost:**
- Check if VAPID keys are in `.env` file
- Check if server restarted after adding keys
- Check browser console for errors
- Make sure service worker is registered

---

### Issue: Windows Push Errors

**Error:** `Received unexpected response code` or `401 Unauthorized`

**Cause:**
- Windows Push Notification Service (WNS) can be finicky
- Subscription may need re-registration
- VAPID keys mismatch

**Solution:**
1. The system automatically removes invalid Windows subscriptions
2. Refresh page and re-subscribe
3. Windows subscriptions will work after re-subscription

---

### Issue: Subscription Not Created

**Symptoms:**
- No push notifications received
- No subscription in database

**Check:**
1. **Browser Console:**
   - Look for: `✅ Push notifications subscribed`
   - Check for errors

2. **Server Logs:**
   - Look for: `✅ Push subscription created for user...`
   - Check for errors

3. **Service Worker:**
   - DevTools → Application → Service Workers
   - Should be "activated and running"

4. **Permissions:**
   - Browser settings → Site settings → Notifications
   - Should be "Allow"

---

### Issue: Notifications Not Received

**Checklist:**
1. ✅ VAPID keys in `.env` file
2. ✅ Server restarted after adding keys
3. ✅ User subscribed (check database)
4. ✅ Browser permission granted
5. ✅ Service worker registered
6. ✅ HTTPS (for production) or localhost (for dev)

**Test:**
1. Create a notification (task, client, etc.)
2. Check server logs: `📱 Push notification sent to X device(s)`
3. Check browser console for errors

---

## Quick Fixes

### Fix 1: Re-subscribe All Users

If VAPID keys were changed:
1. Users need to refresh page and log in again
2. System will automatically create new subscriptions
3. Old subscriptions will be removed on first error

### Fix 2: Clear Old Subscriptions

To manually clear all subscriptions:
```javascript
// In MongoDB or via API
db.pushsubscriptions.deleteMany({})
```

Then users re-subscribe on next login.

### Fix 3: Verify VAPID Keys

Check if keys are loaded:
```bash
cd server
node -e "require('dotenv').config(); console.log('Public Key:', process.env.VAPID_PUBLIC_KEY ? 'Set' : 'Missing')"
```

---

## Testing on Localhost

**Steps:**
1. Add VAPID keys to `server/.env`
2. Start server: `npm run dev`
3. Start client: `npm start`
4. Open `http://localhost:3000`
5. Log in
6. Grant notification permission
7. Check console: `✅ Push notifications subscribed`
8. Create a notification to test

**Expected Behavior:**
- ✅ Service worker registers
- ✅ Subscription created
- ✅ Push notifications work
- ✅ No errors in console

---

## Production vs Localhost

**Localhost:**
- ✅ Works without HTTPS
- ✅ Same functionality
- ✅ Perfect for testing

**Production:**
- ✅ Requires HTTPS
- ✅ Same functionality
- ✅ Works on all devices

**No difference in functionality!**

---

## Summary

- **401 Errors:** Normal when subscriptions are invalid - system handles automatically
- **Localhost:** Works perfectly - not the cause of errors
- **Solution:** Refresh page and re-subscribe
- **System:** Automatically removes invalid subscriptions

The error you're seeing is **expected behavior** - the system is correctly identifying and removing invalid subscriptions. Just refresh and re-subscribe! 🚀

