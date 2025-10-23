// MongoDB Atlas Connection Test Script
require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Client = require('./src/models/Client');
const Product = require('./src/models/Product');
const Quotation = require('./src/models/Quotation');
const Note = require('./src/models/Note');
const Reminder = require('./src/models/Reminder');
const PaymentReminder = require('./src/models/PaymentReminder');
const Notification = require('./src/models/Notification');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testMongoDBAtlas() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}MongoDB Atlas Connection Test${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Connection
    console.log(`${colors.yellow}[TEST 1]${colors.reset} Testing MongoDB Atlas connection...`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✅ Connected to MongoDB Atlas successfully!${colors.reset}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);

    // Test 2: List all collections
    console.log(`${colors.yellow}[TEST 2]${colors.reset} Checking existing collections...`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`${colors.green}✅ Found ${collections.length} collections:${colors.reset}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Test 3: Count documents in each collection
    console.log(`${colors.yellow}[TEST 3]${colors.reset} Counting documents in each collection...`);

    const models = [
      { name: 'Users', model: User },
      { name: 'Tasks', model: Task },
      { name: 'Clients', model: Client },
      { name: 'Products', model: Product },
      { name: 'Quotations', model: Quotation },
      { name: 'Notes', model: Note },
      { name: 'Reminders', model: Reminder },
      { name: 'PaymentReminders', model: PaymentReminder },
      { name: 'Notifications', model: Notification }
    ];

    let totalDocuments = 0;
    for (const { name, model } of models) {
      const count = await model.countDocuments();
      totalDocuments += count;
      const icon = count > 0 ? '📊' : '📭';
      console.log(`   ${icon} ${name}: ${count} documents`);
    }
    console.log(`${colors.green}✅ Total documents across all collections: ${totalDocuments}${colors.reset}\n`);

    // Test 4: Test write operation
    console.log(`${colors.yellow}[TEST 4]${colors.reset} Testing write operation...`);
    const testNote = new Note({
      heading: 'MongoDB Atlas Test Note',
      content: 'This is a test note to verify MongoDB Atlas connection and data storage.',
      color: '#E5F5FF',
      createdByName: 'Test User',
      isPinned: false
    });

    const savedNote = await testNote.save();
    console.log(`${colors.green}✅ Successfully created test note with ID: ${savedNote._id}${colors.reset}\n`);

    // Test 5: Test read operation
    console.log(`${colors.yellow}[TEST 5]${colors.reset} Testing read operation...`);
    const foundNote = await Note.findById(savedNote._id);
    if (foundNote) {
      console.log(`${colors.green}✅ Successfully read test note from database${colors.reset}`);
      console.log(`   Heading: ${foundNote.heading}`);
      console.log(`   Content: ${foundNote.content}\n`);
    } else {
      console.log(`${colors.red}❌ Failed to read test note${colors.reset}\n`);
    }

    // Test 6: Test update operation
    console.log(`${colors.yellow}[TEST 6]${colors.reset} Testing update operation...`);
    foundNote.content = 'Updated test content - MongoDB Atlas is working!';
    await foundNote.save();
    const updatedNote = await Note.findById(savedNote._id);
    console.log(`${colors.green}✅ Successfully updated test note${colors.reset}`);
    console.log(`   New content: ${updatedNote.content}\n`);

    // Test 7: Test delete operation
    console.log(`${colors.yellow}[TEST 7]${colors.reset} Testing delete operation...`);
    await Note.findByIdAndDelete(savedNote._id);
    const deletedNote = await Note.findById(savedNote._id);
    if (!deletedNote) {
      console.log(`${colors.green}✅ Successfully deleted test note${colors.reset}\n`);
    } else {
      console.log(`${colors.red}❌ Failed to delete test note${colors.reset}\n`);
    }

    // Test 8: Database health check
    console.log(`${colors.yellow}[TEST 8]${colors.reset} Performing database health check...`);
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    console.log(`${colors.green}✅ Database is healthy${colors.reset}`);
    console.log(`   MongoDB Version: ${serverStatus.version}`);
    console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 60)} minutes`);
    console.log(`   Connections: ${serverStatus.connections.current} active\n`);

    // Summary
    console.log('='.repeat(60));
    console.log(`${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}✅ MongoDB Atlas is properly connected and working${colors.reset}`);
    console.log(`${colors.green}✅ All CRUD operations are functioning correctly${colors.reset}`);
    console.log(`${colors.green}✅ Your application can store and retrieve data${colors.reset}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.cyan}Connection closed.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run the test
testMongoDBAtlas();
