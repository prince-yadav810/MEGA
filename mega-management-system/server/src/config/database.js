const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management';

    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/mega-management') {
      console.warn('⚠️  MONGODB_URI not set or using default. Database connection may fail in production.');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Clean up stale indexes that might cause duplicate key errors
    try {
      const db = conn.connection.db;
      const quotationsCollection = db.collection('quotations');
      const indexes = await quotationsCollection.indexes();

      // Check for and drop the stale 'number_1' index
      const hasNumberIndex = indexes.some(idx => idx.name === 'number_1');
      if (hasNumberIndex) {
        await quotationsCollection.dropIndex('number_1');
        console.log('✅ Dropped stale index: number_1');
      }
    } catch (indexError) {
      // Ignore if index doesn't exist or collection doesn't exist yet
      if (!indexError.message.includes('index not found') && !indexError.message.includes('ns not found')) {
        console.warn('Index cleanup warning:', indexError.message);
      }
    }

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('   Connection string:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
    console.error('   This will cause authentication and data operations to fail!');
    console.error('   Please check your MONGODB_URI environment variable.');
    // Don't throw - let the app start, but log the error clearly
    // The login controller will check connection state before queries
  }
};

module.exports = connectDB;
