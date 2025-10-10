const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/database');

// Load env vars
dotenv.config();

// Sample product data with placeholder images
const sampleProducts = [
  {
    name: 'Canvas Fire Hose - 2 inch',
    description: 'High-quality canvas fire hose designed for industrial and firefighting applications. Durable, flexible, and resistant to high pressure.',
    category: 'Hoses - Canvas',
    price: 1500,
    currency: 'INR',
    specifications: new Map([
      ['Length', '15 meters'],
      ['Diameter', '2 inches'],
      ['Material', 'Canvas'],
      ['Pressure Rating', '250 PSI'],
      ['Temperature Range', '-20°C to 80°C']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1593113646773-028c25a4082e?w=400', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', isPrimary: false }
    ],
    stock: {
      quantity: 50,
      unit: 'pieces',
      lowStockThreshold: 10
    },
    status: 'active'
  },
  {
    name: 'PVC Hose - 1.5 inch',
    description: 'Flexible PVC hose suitable for general purposes including water transfer, irrigation, and light industrial use.',
    category: 'Hoses - PVC',
    price: 800,
    currency: 'INR',
    specifications: new Map([
      ['Length', '10 meters'],
      ['Diameter', '1.5 inches'],
      ['Material', 'PVC'],
      ['Pressure Rating', '150 PSI'],
      ['Color', 'Blue']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 100,
      unit: 'pieces',
      lowStockThreshold: 20
    },
    status: 'active'
  },
  {
    name: 'Rubber-lined Hose - 3 inch',
    description: 'Premium rubber-lined fire hose offering superior durability and resistance to extreme conditions.',
    category: 'Hoses - Rubber-lined',
    price: 2500,
    currency: 'INR',
    specifications: new Map([
      ['Length', '20 meters'],
      ['Diameter', '3 inches'],
      ['Material', 'Rubber-lined'],
      ['Pressure Rating', '300 PSI'],
      ['Lining', 'EPDM Rubber']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 30,
      unit: 'pieces',
      lowStockThreshold: 5
    },
    status: 'active'
  },
  {
    name: 'Brass Connector - 2 inch Male/Female',
    description: 'Heavy-duty brass connector with male/female threads. Corrosion-resistant and suitable for high-pressure applications.',
    category: 'Connectors',
    price: 350,
    currency: 'INR',
    specifications: new Map([
      ['Size', '2 inches'],
      ['Material', 'Brass'],
      ['Type', 'Male/Female'],
      ['Thread Type', 'NPT'],
      ['Weight', '500g']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 200,
      unit: 'pieces',
      lowStockThreshold: 30
    },
    status: 'active'
  },
  {
    name: 'Aluminum Storz Coupling - 65mm',
    description: 'Lightweight aluminum Storz coupling for quick connection and disconnection of hoses.',
    category: 'Connectors',
    price: 450,
    currency: 'INR',
    specifications: new Map([
      ['Size', '65mm'],
      ['Material', 'Aluminum Alloy'],
      ['Type', 'Storz'],
      ['Standard', 'DIN 14420']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092918484-8313e1f84b1e?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 150,
      unit: 'pieces',
      lowStockThreshold: 25
    },
    status: 'active'
  },
  {
    name: 'Fire Safety Helmet',
    description: 'Professional firefighting helmet with heat-resistant shell and comfortable inner lining.',
    category: 'Safety Equipment',
    price: 3500,
    currency: 'INR',
    specifications: new Map([
      ['Material', 'Thermoplastic'],
      ['Color', 'Yellow/Red'],
      ['Standard', 'EN 443'],
      ['Weight', '1.2kg'],
      ['Size', 'Adjustable']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1587844791954-bc2ccc474e0a?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 75,
      unit: 'pieces',
      lowStockThreshold: 15
    },
    status: 'active'
  },
  {
    name: 'Industrial Safety Gloves',
    description: 'Heat-resistant safety gloves for firefighting and industrial applications.',
    category: 'Safety Equipment',
    price: 800,
    currency: 'INR',
    specifications: new Map([
      ['Material', 'Kevlar/Leather'],
      ['Size', 'Large'],
      ['Heat Resistance', 'Up to 250°C'],
      ['Type', 'Structural Firefighting']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 120,
      unit: 'pairs',
      lowStockThreshold: 20
    },
    status: 'active'
  },
  {
    name: 'Fire Extinguisher - 9kg ABC',
    description: 'Multi-purpose dry powder fire extinguisher suitable for Class A, B, and C fires.',
    category: 'Safety Equipment',
    price: 2200,
    currency: 'INR',
    specifications: new Map([
      ['Capacity', '9kg'],
      ['Type', 'ABC Dry Powder'],
      ['Discharge Time', '13-15 seconds'],
      ['Effective Range', '4-5 meters'],
      ['Standard', 'IS 15683']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1578663248851-cfbb4b4de8c6?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 60,
      unit: 'pieces',
      lowStockThreshold: 10
    },
    status: 'active'
  },
  {
    name: 'Nozzle - Adjustable Spray',
    description: 'Professional adjustable spray nozzle with multiple pattern options.',
    category: 'Custom',
    customCategory: 'Nozzles & Accessories',
    price: 650,
    currency: 'INR',
    specifications: new Map([
      ['Material', 'Brass/Aluminum'],
      ['Size', '1.5 inch'],
      ['Patterns', 'Straight Stream, Fog, Shut-off'],
      ['Flow Rate', '500 LPM']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 80,
      unit: 'pieces',
      lowStockThreshold: 15
    },
    status: 'active'
  },
  {
    name: 'Hose Reel - Wall Mounted',
    description: 'Durable wall-mounted hose reel for organized storage and easy deployment.',
    category: 'Custom',
    customCategory: 'Storage & Accessories',
    price: 4500,
    currency: 'INR',
    specifications: new Map([
      ['Capacity', '30 meters'],
      ['Material', 'Steel'],
      ['Type', 'Swivel'],
      ['Mounting', 'Wall-mounted'],
      ['Color', 'Red']
    ]),
    images: [
      { url: 'https://images.unsplash.com/photo-1581092918484-8313e1f84b1e?w=400', isPrimary: true }
    ],
    stock: {
      quantity: 25,
      unit: 'pieces',
      lowStockThreshold: 5
    },
    status: 'active'
  }
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});

    console.log('🌱 Seeding products...');
    const products = [];

    // Create products one by one to trigger pre-save hooks
    for (const productData of sampleProducts) {
      const product = await Product.create(productData);
      products.push(product);
    }

    console.log(`✅ Successfully seeded ${products.length} products!`);
    console.log('\nSample products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku}) - ₹${product.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run seeder
seedProducts();
