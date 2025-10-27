const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Team members from frontend sampleData
const teamMembers = [
  { name: "Rajesh Kumar", avatar: "RK", email: "rajesh@mega.com", phone: "+91 98765 43210", department: "Sales", role: "employee" },
  { name: "Priya Sharma", avatar: "PS", email: "priya@mega.com", phone: "+91 98765 43211", department: "Marketing", role: "employee" },
  { name: "Amit Patel", avatar: "AP", email: "amit@mega.com", phone: "+91 98765 43212", department: "IT", role: "employee" },
  { name: "Sneha Reddy", avatar: "SR", email: "sneha@mega.com", phone: "+91 98765 43213", department: "HR", role: "employee" },
  { name: "Vikash Singh", avatar: "VS", email: "vikash@mega.com", phone: "+91 98765 43214", department: "Operations", role: "employee" }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management');
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Hash default password
    const defaultPassword = await bcrypt.hash('password123', 10);

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
    }

    // Create users
    const usersToCreate = [];
    for (const member of teamMembers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: member.email });
      if (!existingUser) {
        usersToCreate.push({
          name: member.name,
          email: member.email,
          password: defaultPassword,
          phone: member.phone,
          department: member.department,
          role: member.role,
          avatar: member.avatar,
          isActive: true
        });
      } else {
        console.log(`User ${member.email} already exists, skipping...`);
      }
    }

    if (usersToCreate.length > 0) {
      const createdUsers = await User.insertMany(usersToCreate);
      console.log(`\n✓ Successfully created ${createdUsers.length} users:`);
      createdUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
      });

      console.log('\n📋 User IDs for frontend integration:');
      console.log('Copy these IDs to update your frontend teamMembers:');
      createdUsers.forEach(user => {
        console.log(`  { id: "${user._id}", name: "${user.name}", avatar: "${user.avatar}", email: "${user.email}" }`);
      });
    } else {
      console.log('\nAll users already exist in the database.');

      // Fetch and display existing users
      const existingUsers = await User.find({ email: { $in: teamMembers.map(m => m.email) } });
      console.log('\n📋 Existing User IDs for frontend integration:');
      existingUsers.forEach(user => {
        console.log(`  { id: "${user._id}", name: "${user.name}", avatar: "${user.avatar || user.name.substring(0, 2).toUpperCase()}", email: "${user.email}" }`);
      });
    }

    console.log('\n✅ User seeding completed!');
    console.log('Default password for all users: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
