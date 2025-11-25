#!/usr/bin/env node

/**
 * Gemini API Test Script
 * Tests the Gemini API connection and business card parsing functionality
 *
 * Usage: node test-gemini-api.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function testBasicConnection() {
  logSection('TEST 1: Basic Gemini API Connection');

  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      log('✗ FAIL: GEMINI_API_KEY not found in environment variables', 'red');
      log('  Please check your .env file', 'yellow');
      return false;
    }

    log(`✓ API Key found: ${process.env.GEMINI_API_KEY.substring(0, 20)}...`, 'green');

    // Initialize API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    log('✓ Gemini API initialized with model: gemini-2.5-flash', 'green');

    // Test simple prompt
    log('\nSending test prompt: "Say hello"', 'cyan');
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    const text = response.text();

    if (text && text.length > 0) {
      log('✓ PASS: Gemini API responded successfully', 'green');
      log(`  Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`, 'cyan');
      return true;
    } else {
      log('✗ FAIL: Empty response from Gemini API', 'red');
      return false;
    }
  } catch (error) {
    log('✗ FAIL: Error connecting to Gemini API', 'red');
    log(`  Error: ${error.message}`, 'red');

    if (error.message.includes('API key')) {
      log('  → Check your GEMINI_API_KEY is valid', 'yellow');
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      log('  → The model "gemini-2.5-flash" may not be available', 'yellow');
      log('  → Try using "gemini-2.5-pro" or check Google AI Studio for available models', 'yellow');
    } else if (error.message.includes('quota')) {
      log('  → API quota exceeded. Check your usage limits', 'yellow');
    }

    return false;
  }
}

async function testBusinessCardParsing() {
  logSection('TEST 2: Business Card Text Parsing');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Sample business card text
    const sampleCardText = `
      ACME Corporation
      John Doe
      Chief Technology Officer

      Phone: +91-98765-43210
      Email: john.doe@acmecorp.com

      123 Tech Park, Electronic City
      Bangalore, Karnataka 560100
      India

      www.acmecorp.com
    `;

    log('Testing with sample business card text...', 'cyan');

    const prompt = `You are a business card data extraction assistant. Extract information from the following business card text and return ONLY valid JSON with NO markdown, NO code blocks, NO backticks.

Business Card Text:
---
${sampleCardText}
---

Return JSON in EXACT format:
{
  "companyName": "string",
  "businessType": "string or empty",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "India"
  },
  "companyWebsite": "string or empty",
  "contactPersons": [
    {
      "name": "string",
      "designation": "string",
      "phone": "string (10 digits cleaned)",
      "email": "string (lowercase)",
      "whatsappNumber": "string (same as phone if not specified)",
      "isPrimary": true
    }
  ],
  "notes": "any additional info",
  "confidence": {
    "companyName": "high/medium/low",
    "address": "high/medium/low",
    "contactPersons": "high/medium/low"
  }
}

Return ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean response
    text = text.trim();
    text = text.replace(/```json\s*/gi, '');
    text = text.replace(/```\s*/g, '');
    text = text.trim();

    log('Raw response received:', 'cyan');
    log(text.substring(0, 500) + (text.length > 500 ? '...' : ''), 'cyan');

    // Try to parse JSON
    try {
      const parsed = JSON.parse(text);

      log('\n✓ PASS: Successfully parsed business card data', 'green');
      log('\nExtracted Data:', 'cyan');
      log(`  Company: ${parsed.companyName}`, 'cyan');
      log(`  Contact: ${parsed.contactPersons?.[0]?.name || 'N/A'}`, 'cyan');
      log(`  Designation: ${parsed.contactPersons?.[0]?.designation || 'N/A'}`, 'cyan');
      log(`  Phone: ${parsed.contactPersons?.[0]?.phone || 'N/A'}`, 'cyan');
      log(`  Email: ${parsed.contactPersons?.[0]?.email || 'N/A'}`, 'cyan');
      log(`  City: ${parsed.address?.city || 'N/A'}`, 'cyan');

      return true;
    } catch (parseError) {
      log('\n✗ FAIL: Could not parse JSON response', 'red');
      log(`  Parse Error: ${parseError.message}`, 'red');
      log('  → The AI may have returned malformed JSON', 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ FAIL: Error during business card parsing test', 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function testModelAvailability() {
  logSection('TEST 3: Check Alternative Models');

  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('test');
      const response = await result.response;

      if (response.text().length > 0) {
        log(`✓ ${modelName.padEnd(25)} - Available`, 'green');
      }
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        log(`✗ ${modelName.padEnd(25)} - Not Found (404)`, 'red');
      } else if (error.message.includes('API key')) {
        log(`? ${modelName.padEnd(25)} - API Key Error`, 'yellow');
        break; // No need to test others if API key is invalid
      } else {
        log(`✗ ${modelName.padEnd(25)} - Error: ${error.message}`, 'red');
      }
    }
  }
}

async function runAllTests() {
  log('\n' + '█'.repeat(60), 'blue');
  log('  GEMINI API TEST SUITE', 'bold');
  log('█'.repeat(60) + '\n', 'blue');

  const results = {
    basicConnection: false,
    businessCardParsing: false
  };

  // Test 1: Basic Connection
  results.basicConnection = await testBasicConnection();

  // Only proceed to Test 2 if Test 1 passes
  if (results.basicConnection) {
    results.businessCardParsing = await testBusinessCardParsing();
  } else {
    log('\nSkipping Test 2 (business card parsing) due to connection failure', 'yellow');
  }

  // Test 3: Check alternative models
  await testModelAvailability();

  // Final Summary
  logSection('TEST SUMMARY');

  const totalTests = 2;
  const passedTests = Object.values(results).filter(r => r === true).length;

  log(`\nTests Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'red');
  log(`Basic Connection:       ${results.basicConnection ? '✓ PASS' : '✗ FAIL'}`, results.basicConnection ? 'green' : 'red');
  log(`Business Card Parsing:  ${results.businessCardParsing ? '✓ PASS' : '✗ FAIL'}`, results.businessCardParsing ? 'green' : 'red');

  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Your Gemini API is working correctly.', 'green');
    log('   You can now use the business card upload feature.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    log('   Common fixes:', 'yellow');
    log('   1. Verify GEMINI_API_KEY in your .env file', 'yellow');
    log('   2. Check your API quota at https://aistudio.google.com/', 'yellow');
    log('   3. Ensure you have internet connectivity', 'yellow');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log('\n✗ Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});
