const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    // Create admin user from .env if provided
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!existingAdmin) {
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = await User.create({
          name: 'Admin',
          email: adminEmail.toLowerCase(),
          password: hashedAdminPassword,
          phone: '+91 99999 99999',
          department: 'Management',
          role: 'manager',
          avatar: '',
          isActive: true
        });
        console.log(`\n✓ Manager user created successfully:`);
        console.log(`  - ${adminUser.name} (${adminUser.email}) - ID: ${adminUser._id}`);
      } else {
        console.log(`\n✓ Manager user already exists: ${adminEmail}`);
      }
    } else {
      console.log('\n⚠️  No manager credentials found in .env (ADMIN_EMAIL, ADMIN_PASSWORD)');
      console.log('Please add ADMIN_EMAIL and ADMIN_PASSWORD to your .env file to create a manager account.');
    }

    console.log('\n✅ User seeding completed!');
    console.log('\n💡 Add team members through the application UI (Team Management page) instead of seeding them.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
