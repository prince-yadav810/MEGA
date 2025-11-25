const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mega-management';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

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
    console.error(`Error: ${error.message}`);
    console.log('Application will continue without database. Using localStorage fallback.');
  }
};

module.exports = connectDB;
