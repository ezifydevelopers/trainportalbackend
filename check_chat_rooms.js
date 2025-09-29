const prisma = require('./trainportalbackend/src/prismaClient');

async function checkChatRooms() {
  console.log('🔍 Checking Chat Rooms and Participants\n');
  
  try {
    await prisma.$connect();
    
    // Get all chat rooms
    const chatRooms = await prisma.chatRoom.findMany({
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
    
    console.log(`📊 Found ${chatRooms.length} chat rooms:`);
    
    chatRooms.forEach(room => {
      console.log(`\n🏠 Chat Room ${room.id}:`);
      console.log(`   Type: ${room.type}`);
      console.log(`   Company ID: ${room.companyId}`);
      console.log(`   Created: ${room.createdAt}`);
      console.log(`   Participants (${room.participants.length}):`);
      
      room.participants.forEach(participant => {
        console.log(`     - User ${participant.user.id}: ${participant.user.name} (${participant.user.role})`);
      });
    });
    
    // Check if user 1 is in any chat rooms
    console.log('\n👤 User 1 participation:');
    const user1Rooms = await prisma.chatRoomParticipant.findMany({
      where: { userId: 1 },
      include: {
        chatRoom: true
      }
    });
    
    if (user1Rooms.length === 0) {
      console.log('❌ User 1 is not in any chat rooms');
      console.log('💡 Solution: Create a chat room or add user 1 to an existing one');
    } else {
      console.log(`✅ User 1 is in ${user1Rooms.length} chat rooms:`);
      user1Rooms.forEach(room => {
        console.log(`   - Room ${room.chatRoomId}: ${room.chatRoom.type}`);
      });
    }
    
    // Check if chat room 4 exists
    console.log('\n🔍 Checking chat room 4:');
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
    
    if (!room4) {
      console.log('❌ Chat room 4 does not exist');
    } else {
      console.log('✅ Chat room 4 exists:');
      console.log(`   Type: ${room4.type}`);
      console.log(`   Company ID: ${room4.companyId}`);
      console.log(`   Participants (${room4.participants.length}):`);
      room4.participants.forEach(participant => {
        console.log(`     - User ${participant.user.id}: ${participant.user.name} (${participant.user.role})`);
      });
      
      const isUser1InRoom4 = room4.participants.some(p => p.userId === 1);
      if (isUser1InRoom4) {
        console.log('✅ User 1 is a participant in room 4');
      } else {
        console.log('❌ User 1 is NOT a participant in room 4');
        console.log('💡 Solution: Add user 1 to room 4 or use a different room');
      }
    }
    
    // Create a test chat room for user 1 if needed
    if (user1Rooms.length === 0) {
      console.log('\n🔧 Creating a test chat room for user 1...');
      
      const testRoom = await prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          companyId: null, // Cross-company chat
        }
      });
      
      await prisma.chatRoomParticipant.create({
        data: {
          userId: 1,
          chatRoomId: testRoom.id
        }
      });
      
      console.log(`✅ Created test chat room ${testRoom.id} with user 1`);
      console.log(`💡 Use chat room ${testRoom.id} instead of room 4`);
    }
    
  } catch (error) {
    console.error('❌ Error checking chat rooms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChatRooms();
