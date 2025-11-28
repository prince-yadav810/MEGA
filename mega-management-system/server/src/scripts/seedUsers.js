const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    // Define users to create
    const usersToCreate = [
      {
        name: 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        phone: '+91 88888 88888',
        department: 'Management',
        role: 'super_admin',
        label: 'Super Admin'
      },
      {
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        phone: '+91 99999 99999',
        department: 'Management',
        role: 'admin',
        label: 'Admin'
      },
      {
        name: 'Manager',
        email: process.env.MANAGER_EMAIL,
        password: process.env.MANAGER_PASSWORD,
        phone: '+91 77777 77777',
        department: 'Management',
        role: 'manager',
        label: 'Manager'
      }
    ];

    // Create each user
    for (const userData of usersToCreate) {
      if (userData.email && userData.password) {
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const newUser = await User.create({
            name: userData.name,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            phone: userData.phone,
            department: userData.department,
            role: userData.role,
            avatar: '',
            isActive: true
          });
          console.log(`\n✓ ${userData.label} user created successfully:`);
          console.log(`  - ${newUser.name} (${newUser.email}) - Role: ${newUser.role} - ID: ${newUser._id}`);
        } else {
          console.log(`\n✓ ${userData.label} user already exists: ${userData.email}`);
        }
      } else {
        console.log(`\n⚠️  No ${userData.label} credentials found in .env`);
      }
    }

    console.log('\n✅ User seeding completed!');
    console.log('\n💡 You can now login with any of the created accounts.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
