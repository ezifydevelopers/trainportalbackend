const jwt = require('jsonwebtoken');
const prisma = require('./trainportalbackend/src/prismaClient');

async function testChatAuthentication() {
  console.log('🔧 Testing chat authentication...\n');
  
  try {
    // Test 1: Check JWT_SECRET
    console.log('1. Checking JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment variables');
      console.log('   Please set JWT_SECRET in your .env file');
      return;
    }
    console.log('✅ JWT_SECRET is configured');
    
    // Test 2: Check if we can connect to database
    console.log('\n2. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test 3: Check if users exist
    console.log('\n3. Checking users in database...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    if (userCount > 0) {
      const sampleUser = await prisma.user.findFirst({
        select: { id: true, name: true, role: true, companyId: true }
      });
      console.log('   Sample user:', sampleUser);
      
      // Test 4: Generate a test token
      console.log('\n4. Testing JWT token generation...');
      const testToken = jwt.sign(
        { id: sampleUser.id, role: sampleUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('✅ Test token generated successfully');
      
      // Test 5: Verify the token
      console.log('\n5. Testing JWT token verification...');
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
      console.log('✅ Token verified successfully:', decoded);
      
      // Test 6: Check if user exists in database
      console.log('\n6. Testing user lookup...');
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) {
        console.log('✅ User found in database:', {
          id: user.id,
          name: user.name,
          role: user.role,
          companyId: user.companyId
        });
      } else {
        console.log('❌ User not found in database');
      }
    }
    
    // Test 7: Check chat rooms
    console.log('\n7. Checking chat rooms...');
    const chatRoomCount = await prisma.chatRoom.count();
    console.log(`✅ Found ${chatRoomCount} chat rooms in database`);
    
    // Test 8: Check messages
    console.log('\n8. Checking messages...');
    const messageCount = await prisma.message.count();
    console.log(`✅ Found ${messageCount} messages in database`);
    
    console.log('\n🎉 Authentication test completed successfully!');
    console.log('\n💡 If you\'re still getting 403 errors, check:');
    console.log('   1. Make sure the frontend is sending the correct Authorization header');
    console.log('   2. Check if the token is expired');
    console.log('   3. Verify the JWT_SECRET matches between frontend and backend');
    console.log('   4. Check browser console for any CORS errors');
    
  } catch (error) {
    console.error('\n❌ Error testing authentication:', error);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('\n💡 JWT Error - Check your JWT_SECRET configuration');
    } else if (error.code === 'P2002') {
      console.log('\n💡 Database Error - Check your database connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testChatAuthentication();
