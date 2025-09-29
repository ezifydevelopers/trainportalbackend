const prisma = require('./src/prismaClient');

async function fixRoom46() {
  console.log('🔧 Fixing Room 46 Access\n');
  
  try {
    await prisma.$connect();
    
    // Check room 46
    console.log('1. Checking room 46...');
    const room46 = await prisma.chatRoom.findUnique({
      where: { id: 46 },
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
    
    if (!room46) {
      console.log('❌ Room 46 not found');
      return;
    }
    
    console.log('✅ Room 46 found');
    console.log(`   Type: ${room46.type}`);
    console.log(`   Company ID: ${room46.companyId}`);
    console.log(`   Current participants: ${room46.participants.length}`);
    
    // Check if user 23 is in room 46
    const isUser23InRoom46 = room46.participants.some(p => p.userId === 23);
    
    if (isUser23InRoom46) {
      console.log('✅ User 23 is already in room 46');
    } else {
      console.log('❌ User 23 is NOT in room 46');
      console.log('Adding user 23 to room 46...');
      
      const participant = await prisma.chatRoomParticipant.create({
        data: {
          userId: 23,
          chatRoomId: 46
        }
      });
      
      console.log('✅ User 23 added to room 46');
      console.log('Participant ID:', participant.id);
    }
    
    // Also check and fix other rooms that might be accessed
    console.log('\n2. Checking other rooms...');
    const roomsToCheck = [46, 47, 48, 49, 50];
    
    for (const roomId of roomsToCheck) {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            where: { userId: 23 }
          }
        }
      });
      
      if (room) {
        if (room.participants.length === 0) {
          console.log(`   Adding user 23 to room ${roomId}...`);
          await prisma.chatRoomParticipant.create({
            data: {
              userId: 23,
              chatRoomId: roomId
            }
          });
          console.log(`   ✅ User 23 added to room ${roomId}`);
        } else {
          console.log(`   ✅ User 23 already in room ${roomId}`);
        }
      }
    }
    
    // Verify the fix
    console.log('\n3. Verifying fix...');
    const updatedRoom46 = await prisma.chatRoom.findUnique({
      where: { id: 46 },
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
    
    console.log('✅ Room 46 now has participants:');
    updatedRoom46.participants.forEach(participant => {
      console.log(`   - User ${participant.user.id}: ${participant.user.name} (${participant.user.role})`);
    });
    
    console.log('\n🎉 Fix completed!');
    console.log('💡 User 23 should now be able to access room 46 and other rooms');
    
  } catch (error) {
    console.error('\n❌ Error fixing room 46:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoom46();
