const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const usersToCreate = [
  {
    name: 'Super Admin',
    email: 'superadmin@mega.com',
    password: 'SuperAdmin@123456!',
    role: 'super_admin',
    department: 'Management',
    phone: '+91 00000 00001'
  },
  {
    name: 'Admin',
    email: 'admin@mega.com',
    password: 'Admin@123456!',
    role: 'admin',
    department: 'Management',
    phone: '+91 00000 00002'
  },
  {
    name: 'Manager',
    email: 'manager@mega.com',
    password: 'Manager@123456!',
    role: 'manager',
    department: 'Operations',
    phone: '+91 00000 00003'
  }
];

const seedSpecificUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    for (const userData of usersToCreate) {
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      
      if (existingUser) {
        // Update password and role to match desired credentials
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        existingUser.password = hashedPassword;
        existingUser.role = userData.role;
        existingUser.name = userData.name; // Ensure name is correct too
        await existingUser.save();
        console.log(`Updated existing user: ${userData.email}`);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
          isActive: true
        });
        console.log(`Created new user: ${userData.email}`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedSpecificUsers();






