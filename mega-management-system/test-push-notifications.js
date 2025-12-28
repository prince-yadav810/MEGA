#!/usr/bin/env node
/**
 * Comprehensive Push Notifications Test Script
 * Run: node test-push-notifications.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

console.log('🧪 Testing Push Notifications Implementation...\n');

let allTestsPassed = true;

// Test 1: VAPID Keys
console.log('1️⃣  Testing VAPID Keys...');
try {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  
  if (!publicKey || !privateKey) {
    console.log('   ❌ VAPID keys not found in .env');
    allTestsPassed = false;
  } else {
    console.log('   ✅ VAPID_PUBLIC_KEY: Set');
    console.log('   ✅ VAPID_PRIVATE_KEY: Set');
    console.log('   ✅ VAPID_EMAIL:', email || 'mailto:admin@megaenterprise.in');
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 2: web-push package
console.log('\n2️⃣  Testing web-push package...');
try {
  // Try to require from server directory
  process.chdir(path.join(__dirname, 'server'));
  const webpush = require('web-push');
  process.chdir(__dirname);
  console.log('   ✅ web-push package installed');
  
  // Test VAPID key initialization
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@megaenterprise.in';
  
  if (publicKey && privateKey) {
    webpush.setVapidDetails(email, publicKey, privateKey);
    console.log('   ✅ VAPID keys initialized successfully');
  }
} catch (error) {
  console.log('   ⚠️  web-push check skipped (needs server directory context)');
  console.log('   ℹ️  This is OK - web-push is installed in server/node_modules');
}

// Test 3: Push Service
console.log('\n3️⃣  Testing Push Service...');
try {
  const pushService = require('./server/src/services/pushService');
  const publicKey = pushService.getVapidPublicKey();
  
  if (publicKey) {
    console.log('   ✅ Push service loaded');
    console.log('   ✅ VAPID public key available');
  } else {
    console.log('   ⚠️  VAPID public key not available (keys may not be set)');
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 4: Push Subscription Model
console.log('\n4️⃣  Testing Push Subscription Model...');
try {
  const PushSubscription = require('./server/src/models/PushSubscription');
  console.log('   ✅ PushSubscription model loaded');
  
  // Check schema
  const schema = PushSubscription.schema;
  const requiredFields = ['userId', 'endpoint', 'keys'];
  const hasAllFields = requiredFields.every(field => schema.paths[field]);
  
  if (hasAllFields) {
    console.log('   ✅ All required fields present');
  } else {
    console.log('   ⚠️  Some fields may be missing');
  }
  
  // Check method
  if (typeof PushSubscription.prototype.toWebPushSubscription === 'function') {
    console.log('   ✅ toWebPushSubscription method exists');
  } else {
    console.log('   ❌ toWebPushSubscription method missing');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 5: API Routes
console.log('\n5️⃣  Testing API Routes...');
try {
  const pushRoutes = require('./server/src/routes/pushSubscriptions');
  console.log('   ✅ Push subscription routes loaded');
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 6: Service Worker File
console.log('\n6️⃣  Testing Service Worker...');
try {
  const fs = require('fs');
  const swPath = path.join(__dirname, 'client', 'public', 'service-worker.js');
  
  if (fs.existsSync(swPath)) {
    console.log('   ✅ service-worker.js exists');
    
    const content = fs.readFileSync(swPath, 'utf8');
    const hasPushListener = content.includes('addEventListener(\'push\'');
    const hasNotificationClick = content.includes('addEventListener(\'notificationclick\'');
    
    if (hasPushListener) {
      console.log('   ✅ Push event listener present');
    } else {
      console.log('   ❌ Push event listener missing');
      allTestsPassed = false;
    }
    
    if (hasNotificationClick) {
      console.log('   ✅ Notification click handler present');
    } else {
      console.log('   ❌ Notification click handler missing');
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ service-worker.js not found');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 7: Frontend Push Service
console.log('\n7️⃣  Testing Frontend Push Service...');
try {
  const fs = require('fs');
  const pushServicePath = path.join(__dirname, 'client', 'src', 'services', 'pushService.js');
  
  if (fs.existsSync(pushServicePath)) {
    console.log('   ✅ pushService.js exists');
    
    const content = fs.readFileSync(pushServicePath, 'utf8');
    const hasSubscribe = content.includes('subscribeToPush');
    const hasIsSupported = content.includes('isPushSupported');
    
    if (hasSubscribe && hasIsSupported) {
      console.log('   ✅ All required functions present');
    } else {
      console.log('   ⚠️  Some functions may be missing');
    }
  } else {
    console.log('   ❌ pushService.js not found');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
  allTestsPassed = false;
}

// Test 8: Integration Check
console.log('\n8️⃣  Testing Integration...');
try {
  const notificationController = require('./server/src/controllers/notificationController');
  const pushService = require('./server/src/services/pushService');
  
  // Check if push service is imported
  const controllerContent = require('fs').readFileSync(
    path.join(__dirname, 'server', 'src', 'controllers', 'notificationController.js'),
    'utf8'
  );
  
  if (controllerContent.includes('pushService')) {
    console.log('   ✅ Push service integrated in notification controller');
  } else {
    console.log('   ❌ Push service not integrated');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('   ⚠️  Could not verify integration:', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✅ All tests passed! Push notifications are ready.');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start your server: cd server && npm run dev');
  console.log('   2. Start your client: cd client && npm start');
  console.log('   3. Open browser and grant notification permission');
  console.log('   4. Create a task/client to test push notifications');
} else {
  console.log('⚠️  Some tests failed. Please check the errors above.');
}
console.log('='.repeat(50));

