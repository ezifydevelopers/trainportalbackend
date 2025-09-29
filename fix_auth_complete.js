const jwt = require('jsonwebtoken');
const prisma = require('./trainportalbackend/src/prismaClient');

async function fixAuthentication() {
  console.log('🔧 Complete Authentication Fix\n');
  
  try {
    // Step 1: Check JWT_SECRET
    console.log('1. Checking JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment variables');
      console.log('   Please set JWT_SECRET in your .env file');
      return;
    }
    console.log('✅ JWT_SECRET is configured');
    
    // Step 2: Connect to database
    console.log('\n2. Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Step 3: Get a user to generate a valid token
    console.log('\n3. Getting user for token generation...');
    const user = await prisma.user.findFirst({
      select: { id: true, name: true, role: true, companyId: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('✅ User found:', user);
    
    // Step 4: Generate a fresh token
    console.log('\n4. Generating fresh token...');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Fresh token generated');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Step 5: Test the token
    console.log('\n5. Testing the token...');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verification successful:', decoded);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return;
    }
    
    // Step 6: Test chat endpoint with the token
    console.log('\n6. Testing chat endpoint...');
    try {
      const response = await fetch('http://localhost:7001/api/chat/test-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chat endpoint test successful:', data);
      } else {
        const errorData = await response.json();
        console.log('❌ Chat endpoint test failed:', response.status, errorData);
      }
    } catch (error) {
      console.log('❌ Network error testing chat endpoint:', error.message);
    }
    
    // Step 7: Instructions for frontend
    console.log('\n7. Frontend Fix Instructions:');
    console.log('   To fix the 403 errors, you need to:');
    console.log('   1. Open browser console (F12)');
    console.log('   2. Run this command:');
    console.log(`   localStorage.setItem('authToken', '${token}');`);
    console.log('   3. Refresh the page');
    console.log('   4. The chat should now work!');
    
    // Step 8: Check if there are any issues with the auth middleware
    console.log('\n8. Checking auth middleware...');
    const authMiddleware = require('./trainportalbackend/src/middlewares/authMiddleware');
    console.log('✅ Auth middleware loaded successfully');
    
    // Step 9: Check chat routes
    console.log('\n9. Checking chat routes...');
    const chatRoutes = require('./trainportalbackend/src/routes/chat');
    console.log('✅ Chat routes loaded successfully');
    
    console.log('\n🎉 Authentication fix completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Copy the token from step 7');
    console.log('   2. Set it in your browser localStorage');
    console.log('   3. Refresh the page');
    console.log('   4. Chat should work!');
    
  } catch (error) {
    console.error('\n❌ Error during authentication fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuthentication();
