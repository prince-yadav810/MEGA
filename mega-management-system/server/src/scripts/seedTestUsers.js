const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    // Test users to create
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@mega.com',
        password: 'Admin@123456!',
        phone: '+91 98765 43210',
        department: 'Management',
        role: 'admin',
        avatar: '',
        isActive: true
      },
      {
        name: 'Manager User',
        email: 'manager@mega.com',
        password: 'Manager@123456!',
        phone: '+91 98765 43211',
        department: 'Management',
        role: 'manager',
        avatar: '',
        isActive: true
      }
    ];

    console.log('\n🌱 Seeding test users...\n');

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          ...userData,
          email: userData.email.toLowerCase(),
          password: hashedPassword
        });
        console.log(`✓ ${user.role.toUpperCase()} created successfully:`);
        console.log(`  - Name: ${user.name}`);
        console.log(`  - Email: ${userData.email}`);
        console.log(`  - Password: ${userData.password}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - ID: ${user._id}\n`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email} (${userData.role})\n`);
      }
    }

    console.log('✅ Test user seeding completed!');
    console.log('\n📝 Login Credentials:\n');
    console.log('Admin Account:');
    console.log('  Email: admin@mega.com');
    console.log('  Password: Admin@123456!\n');
    console.log('Manager Account:');
    console.log('  Email: manager@mega.com');
    console.log('  Password: Manager@123456!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test users:', error);
    process.exit(1);
  }
};

seedTestUsers();
