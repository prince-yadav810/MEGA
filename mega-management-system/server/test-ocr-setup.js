// Quick test script to check OCR setup
// Run with: node test-ocr-setup.js

require('dotenv').config();

console.log('\n🔍 Testing OCR Setup...\n');

// Check Node version
const nodeVersion = process.version;
console.log(`✓ Node version: ${nodeVersion}`);
if (parseInt(nodeVersion.slice(1, 3)) < 18) {
  console.log('❌ ERROR: Node version must be 18 or higher!');
  console.log('   Current version:', nodeVersion);
  console.log('   Run: nvm install 18 && nvm use 18');
  process.exit(1);
} else {
  console.log('✓ Node version is compatible\n');
}

// Check environment variables
console.log('📋 Checking environment variables...');

if (!process.env.GOOGLE_VISION_API_KEY) {
  console.log('❌ GOOGLE_VISION_API_KEY not found in .env');
} else {
  console.log(`✓ GOOGLE_VISION_API_KEY found (${process.env.GOOGLE_VISION_API_KEY.slice(0, 10)}...)`);
}

if (!process.env.GEMINI_API_KEY) {
  console.log('❌ GEMINI_API_KEY not found in .env');
} else {
  console.log(`✓ GEMINI_API_KEY found (${process.env.GEMINI_API_KEY.slice(0, 10)}...)`);
}

console.log('\n📦 Testing package imports...');

// Test Google Vision
try {
  const vision = require('@google-cloud/vision');
  console.log('✓ @google-cloud/vision package loaded');
} catch (error) {
  console.log('❌ @google-cloud/vision failed to load:', error.message);
  process.exit(1);
}

// Test Gemini
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  console.log('✓ @google/generative-ai package loaded');
} catch (error) {
  console.log('❌ @google/generative-ai failed to load:', error.message);
  process.exit(1);
}

// Test services
console.log('\n🔧 Testing services...');

try {
  const googleVisionService = require('./src/services/googleVisionService');
  console.log('✓ Google Vision service loaded');
} catch (error) {
  console.log('❌ Google Vision service failed:', error.message);
  process.exit(1);
}

try {
  const geminiService = require('./src/services/geminiService');
  console.log('✓ Gemini service loaded');
} catch (error) {
  console.log('❌ Gemini service failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All checks passed! OCR setup is ready.');
console.log('\n💡 Next steps:');
console.log('   1. Make sure server is restarted');
console.log('   2. Try uploading a business card');
console.log('   3. Check server logs for any errors\n');
