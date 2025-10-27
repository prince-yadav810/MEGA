const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Fake user emails from the old seed data
const fakeUserEmails = [
  'rajesh@mega.com',
  'priya@mega.com',
  'amit@mega.com',
  'sneha@mega.com',
  'vikash@mega.com'
];

const clearFakeData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    console.log('\n🗑️  Clearing fake data from database...\n');

    // Clear fake users
    console.log('Deleting fake users...');
    const deletedUsers = await User.deleteMany({
      email: { $in: fakeUserEmails }
    });
    console.log(`✓ Deleted ${deletedUsers.deletedCount} fake users`);

    // Clear all products (since they were all seeded as sample data)
    console.log('\nDeleting all seeded products...');
    const deletedProducts = await Product.deleteMany({});
    console.log(`✓ Deleted ${deletedProducts.deletedCount} products`);

    console.log('\n✅ Fake data cleared successfully!');
    console.log('\n💡 Tips:');
    console.log('  - Add real team members through the Team Management page');
    console.log('  - Add real products through the Products page');
    console.log('  - Your admin user (if created via .env) is preserved');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing fake data:', error);
    process.exit(1);
  }
};

clearFakeData();
