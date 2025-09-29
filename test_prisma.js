const prisma = require('./trainportalbackend/src/prismaClient');

async function testPrisma() {
  console.log('🔍 Testing Prisma Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test 2: Test a simple query
    console.log('\n2. Testing simple query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test 3: Test chat room query
    console.log('\n3. Testing chat room query...');
    const chatRooms = await prisma.chatRoom.findMany({
      take: 3,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    console.log(`✅ Found ${chatRooms.length} chat rooms`);
    
    // Test 4: Test specific chat room 4
    console.log('\n4. Testing chat room 4...');
    const room4 = await prisma.chatRoom.findUnique({
      where: { id: 4 },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    });
    
    if (room4) {
      console.log('✅ Chat room 4 exists');
      console.log(`   Participants: ${room4.participants.length}`);
      room4.participants.forEach(p => {
        console.log(`   - User ${p.user.id}: ${p.user.name} (${p.user.role})`);
      });
    } else {
      console.log('❌ Chat room 4 does not exist');
    }
    
    // Test 5: Test messages query
    console.log('\n5. Testing messages query...');
    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: 4 },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${messages.length} messages in room 4`);
    
    // Test 6: Test user 1 participation
    console.log('\n6. Testing user 1 participation...');
    const user1Rooms = await prisma.chatRoomParticipant.findMany({
      where: { userId: 1 },
      include: {
        chatRoom: {
          select: { id: true, type: true }
        }
      }
    });
    console.log(`✅ User 1 is in ${user1Rooms.length} chat rooms`);
    user1Rooms.forEach(room => {
      console.log(`   - Room ${room.chatRoom.id}: ${room.chatRoom.type}`);
    });
    
    // Test 7: Test JWT token validation
    console.log('\n7. Testing JWT token validation...');
    const jwt = require('jsonwebtoken');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5MTU5NTY3LCJleHAiOjE3NTkyNDU5Njd9.EHwY25veMoN-8NjIU5q3wx2E257a410McCnJdZorLyo';
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT token is valid');
      console.log(`   User ID: ${decoded.id}`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    } catch (error) {
      console.log('❌ JWT token is invalid:', error.message);
    }
    
    console.log('\n🎉 Prisma test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Prisma test failed:', error);
    
    if (error.code === 'P1001') {
      console.log('💡 Database connection failed - check if database is running');
    } else if (error.code === 'P2002') {
      console.log('💡 Unique constraint violation');
    } else if (error.code === 'P2025') {
      console.log('💡 Record not found');
    } else {
      console.log('💡 Unknown Prisma error:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
