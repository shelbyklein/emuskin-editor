// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');
  
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Make sure you have a .env file with MONGODB_URI set');
    process.exit(1);
  }
  
  // Mask password in logs
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('📍 Connecting to:', maskedUri);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Get database info
    const db = mongoose.connection.db;
    console.log('\n📊 Database Info:');
    console.log('- Name:', db.databaseName);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('- Ready State:', mongoose.connection.readyState);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:', collections.map(c => c.name).join(', ') || 'None yet');
    
    // Test creating a document
    console.log('\n🧪 Testing write operation...');
    const Project = require('./src/models/Project');
    
    const testProject = new Project({
      _id: `test-${Date.now()}`,
      name: 'Connection Test Project',
      identifier: 'com.test.connection',
      userId: 'test-user',
      userEmail: 'test@example.com'
    });
    
    await testProject.save();
    console.log('✅ Successfully created test document');
    
    // Clean up
    await testProject.deleteOne();
    console.log('🧹 Cleaned up test document');
    
    console.log('\n🎉 All tests passed! MongoDB is properly configured.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your MONGODB_URI is correct');
    console.log('2. Ensure your IP is in Trusted Sources (or use 0.0.0.0/0)');
    console.log('3. Verify database user has correct permissions');
    console.log('4. Check if cluster is running in DigitalOcean dashboard');
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testConnection();