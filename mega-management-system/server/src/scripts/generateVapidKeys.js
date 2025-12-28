// Script to generate VAPID keys for web push notifications
// Run: node src/scripts/generateVapidKeys.js

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for web push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n⚠️  Keep these keys secure and never commit them to version control!');

