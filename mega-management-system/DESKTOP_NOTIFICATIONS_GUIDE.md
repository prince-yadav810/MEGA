# Desktop & Mobile Notifications Guide

## 📱 Overview

Your MEGA Management System now supports **WhatsApp-style desktop and mobile notifications** that work even when you're using other apps or when the browser is in the background!

## ✨ Features

### 1. **Desktop Notifications**
- ✅ Work even when browser tab is not active
- ✅ Display on Windows, Mac, and Linux
- ✅ Custom notification sounds (similar to WhatsApp)
- ✅ Rich formatting with emojis
- ✅ Category-based icons and sounds

### 2. **Mobile Notifications (PWA)**
- ✅ Work on Android and iOS (when installed as PWA)
- ✅ Display on lock screen
- ✅ Vibration patterns
- ✅ Push notifications via Service Worker
- ✅ Work even when browser is closed

### 3. **Notification Categories**

Each notification type has unique styling, sound, and vibration:

| Category | Emoji | Sound | Vibration |
|----------|-------|-------|-----------|
| **Task** | 📋 | 3-tone melody | Medium |
| **Client** | 👥 | 2-tone alert | Short |
| **Quotation** | 📄 | 2-tone alert | Short |
| **Product** | 📦 | 2-tone alert | Short |
| **Note** | 📝 | 2-tone alert | Short |
| **Reminder** | ⏰ | 3-tone urgent | Long pattern |
| **Payment** | 💰 | 3-tone urgent | Long pattern |
| **System** | ℹ️ | Default | Short |

## 🚀 How to Enable

### Step 1: Enable Browser Notifications

When you log in or visit the Inbox, you'll see a **blue banner** at the top asking you to enable notifications:

1. Click **"Enable Notifications"** button
2. Your browser will show a permission dialog
3. Click **"Allow"** in the browser dialog
4. Done! You're all set! 🎉

### Step 2: Test Your Notifications

1. Go to the **Inbox** page
2. Look for the **"Test Notification"** button in the top-right corner
3. Click it to send yourself a test notification
4. You should see a notification appear with sound!

### Step 3: For Mobile (Optional - PWA Installation)

To get notifications on mobile devices:

#### Android:
1. Open the website in Chrome
2. Tap the menu (3 dots) → **"Add to Home Screen"**
3. The app will install as a Progressive Web App
4. Enable notifications when prompted
5. Now you'll get notifications even when the browser is closed!

#### iOS (Safari):
1. Open the website in Safari
2. Tap the Share button → **"Add to Home Screen"**
3. The app will appear as an icon on your home screen
4. Notifications will work when the app is open

## 🎵 Sound Features

Notifications come with **pleasant, non-intrusive sounds** similar to WhatsApp:

- **Multi-tone melody** - Different tones play in sequence for a pleasant alert
- **Category-specific sounds** - Tasks, reminders, and payments have unique sounds
- **Volume optimized** - Not too loud, not too quiet
- **Double-ding effect** - Important notifications play twice for emphasis

### Sound Technical Details:
- Uses Web Audio API for high-quality, cross-platform sounds
- No external audio files needed - sounds are generated programmatically
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Automatically resumes audio context when needed

## 📋 What You'll Get Notifications For

You'll receive desktop/mobile notifications for:

1. **New Task Assigned** - When someone assigns you a task
2. **Task Updates** - When a task you're involved in is updated
3. **Task Status Changes** - When task status changes (To Do → In Progress, etc.)
4. **Task Overdue** - When a task becomes overdue
5. **Client Updates** - New clients or client information changes
6. **Quotation Updates** - New quotations or status changes
7. **Payment Reminders** - Upcoming or overdue payments
8. **Notes & Reminders** - Your personal reminders
9. **System Alerts** - Important system notifications

## 🔧 Technical Implementation

### Components Created:

1. **`browserNotification.js`** - Core notification service with sound
   - Handles browser notification API
   - Generates notification sounds using Web Audio API
   - Manages notification permissions
   - Provides WhatsApp-style formatting

2. **`serviceWorkerRegistration.js`** - PWA support
   - Registers service worker for push notifications
   - Enables background notifications
   - Supports mobile devices

3. **`service-worker.js`** - Background worker
   - Handles push notifications when browser is closed
   - Caches assets for offline support
   - Manages notification clicks and actions

4. **`NotificationPermissionBanner.jsx`** - Permission UI
   - Beautiful, non-intrusive banner
   - Animates in smoothly
   - Can be dismissed or enabled
   - Shows feature benefits

5. **`NotificationContext.js`** - Updated context
   - Integrates desktop notifications with socket events
   - Automatically shows notifications for real-time updates
   - Manages permission state

## 🎨 Notification Format

Each notification includes:

```
[Emoji] [Heading]
Description with details

Created by: [User Name]
[Time ago]
```

Example:
```
📋 New Task Assigned
You have been assigned to "Update Website Design" - Due in 2 days

Created by: John Doe
Just now
```

## 🔒 Privacy & Permissions

- **Permissions required**: Browser notification permission
- **Data stored**: Notification preferences saved in localStorage
- **Privacy**: Notifications are local to your device
- **Control**: You can disable anytime in browser settings
- **Opt-out**: Click "Maybe Later" on the banner, or disable in Settings

## ⚙️ Browser Compatibility

| Browser | Desktop Notifications | Push (Background) | Sound |
|---------|----------------------|-------------------|-------|
| **Chrome** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Firefox** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edge** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Safari** | ✅ Yes | ⚠️ Limited | ✅ Yes |
| **Mobile Chrome** | ✅ Yes | ✅ Yes (PWA) | ✅ Yes |
| **Mobile Safari** | ⚠️ Limited | ❌ No | ⚠️ Limited |

## 🐛 Troubleshooting

### Notifications Not Appearing?

1. **Check browser permissions**:
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Firefox: Preferences → Privacy & Security → Permissions → Notifications
   - Check if your site is allowed

2. **Check OS settings**:
   - **Windows**: Settings → System → Notifications
   - **Mac**: System Preferences → Notifications
   - **Android**: Settings → Apps → Notifications
   - Make sure notifications for your browser are enabled

3. **Check Do Not Disturb**:
   - Disable Do Not Disturb mode on your device
   - Check Focus modes on Mac/iOS

4. **Re-enable notifications**:
   - Go to browser settings
   - Find notifications for your site
   - Remove and re-add permission

### No Sound?

1. **Check browser sound settings**: Make sure browser is not muted
2. **Check system volume**: Increase system volume
3. **Audio context**: Click on the page first (browsers require user interaction)
4. **Browser autoplay policy**: Some browsers block autoplay audio

### Mobile Notifications Not Working?

1. **Install as PWA**: Notifications work best when installed as an app
2. **Check battery saver**: Disable battery optimization for the browser
3. **Background restrictions**: Check if browser can run in background
4. **iOS limitations**: iOS has limited support for background notifications

## 📱 Mobile Installation Guide

### Android (Full Support):

1. Open site in Chrome
2. Tap menu → "Install app" or "Add to Home Screen"
3. App installs with icon
4. Enable notifications
5. Get notifications even when app is closed! ✅

### iOS (Limited Support):

1. Open site in Safari
2. Tap Share → "Add to Home Screen"
3. App installs with icon
4. Notifications work when app is open
5. Background notifications not supported by iOS ⚠️

## 💡 Tips for Best Experience

1. **Enable notifications early** - Don't wait until you need them
2. **Test regularly** - Use the "Test Notification" button
3. **Install as PWA** - Better mobile experience
4. **Keep browser updated** - Latest features require modern browsers
5. **Allow sounds** - Interact with the page to enable audio
6. **Check settings** - Verify OS and browser notification settings

## 🎯 Coming Soon

Future enhancements planned:
- [ ] Custom notification sounds upload
- [ ] Notification scheduling (quiet hours)
- [ ] Priority levels (urgent vs normal)
- [ ] Grouped notifications
- [ ] Action buttons in notifications (Mark as done, Reply, etc.)
- [ ] Email fallback for mobile
- [ ] SMS notifications option

## 🤝 Support

If notifications aren't working:

1. Check this guide first
2. Test with the "Test Notification" button
3. Check browser console for errors (F12 → Console)
4. Try a different browser
5. Contact support with:
   - Browser version
   - Operating system
   - Error messages from console

---

**Enjoy your new WhatsApp-style notifications!** 🎉

Your productivity just got a major upgrade with real-time alerts that keep you informed no matter what you're doing!

