#!/usr/bin/env node

/**
 * Quick test script for Products API
 * Run: node test-products.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/products';

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');

    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    if (response.data.success) {
      log(`✅ ${name} - SUCCESS`, 'green');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
      return response.data;
    } else {
      log(`⚠️  ${name} - Returned but not successful`, 'yellow');
      console.log(response.data);
      return response.data;
    }
  } catch (error) {
    log(`❌ ${name} - FAILED`, 'red');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════', 'blue');
  log('   MEGA Products API - Quick Test Suite', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');

  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/health');
    log('✅ Server is running', 'green');
  } catch (error) {
    log('❌ Server is not running! Start it with: npm run dev', 'red');
    process.exit(1);
  }

  // Test 1: Get all products
  const allProducts = await testEndpoint(
    'GET All Products',
    'GET',
    '?page=1&limit=5'
  );

  // Test 2: Get categories
  await testEndpoint(
    'GET Categories',
    'GET',
    '/categories'
  );

  // Test 3: Get low stock products
  await testEndpoint(
    'GET Low Stock Products',
    'GET',
    '/low-stock'
  );

  // Test 4: Search products
  await testEndpoint(
    'Search Products (hose)',
    'GET',
    '?search=hose&limit=3'
  );

  // Test 5: Filter by category
  await testEndpoint(
    'Filter by Category (Connectors)',
    'GET',
    '?category=Connectors'
  );

  // Test 6: Filter by price range
  await testEndpoint(
    'Filter by Price Range (500-2000)',
    'GET',
    '?minPrice=500&maxPrice=2000'
  );

  // Test 7: Create a product
  const newProduct = await testEndpoint(
    'CREATE Product',
    'POST',
    '',
    {
      name: 'Test Product - API Test',
      description: 'This product was created by the test script',
      category: 'Connectors',
      price: 599,
      currency: 'INR',
      specifications: {
        'Size': '1.5 inches',
        'Material': 'Aluminum',
        'Type': 'Quick Connect'
      },
      images: [
        {
          url: 'https://via.placeholder.com/400?text=Test+Product',
          isPrimary: true
        }
      ],
      stock: {
        quantity: 25,
        unit: 'pieces',
        lowStockThreshold: 5
      },
      status: 'active'
    }
  );

  // Test 8: Get single product (if we created one)
  if (newProduct && newProduct.data && newProduct.data._id) {
    const productId = newProduct.data._id;

    await testEndpoint(
      'GET Single Product',
      'GET',
      `/${productId}`
    );

    // Test 9: Update product
    await testEndpoint(
      'UPDATE Product',
      'PUT',
      `/${productId}`,
      {
        name: 'Test Product - UPDATED',
        price: 649
      }
    );

    // Test 10: Delete product
    await testEndpoint(
      'DELETE Product',
      'DELETE',
      `/${productId}`
    );
  } else if (allProducts && allProducts.data && allProducts.data.length > 0) {
    // Use first product from the list
    const productId = allProducts.data[0]._id;

    await testEndpoint(
      'GET Single Product',
      'GET',
      `/${productId}`
    );
  }

  // Summary
  log('\n═══════════════════════════════════════════', 'blue');
  log('   Test Suite Completed!', 'green');
  log('═══════════════════════════════════════════\n', 'blue');

  log('📋 Summary:', 'yellow');
  log('- All basic CRUD operations tested');
  log('- Search and filter functionality tested');
  log('- Category retrieval tested');
  log('- Low stock alerts tested');
  log('\n💡 For full API documentation, see PRODUCTS_API.md', 'blue');
  log('💡 For setup instructions, see PRODUCTS_SETUP.md\n', 'blue');
}

// Run tests
runTests().catch(error => {
  log('\n❌ Test suite failed:', 'red');
  console.error(error);
  process.exit(1);
});
