const prisma = require('./trainportalbackend/src/prismaClient');

async function fixRoom4() {
  console.log('🔧 Fixing Chat Room 4\n');
  
  try {
    await prisma.$connect();
    
    // Add User 1 to chat room 4
    console.log('Adding User 1 to chat room 4...');
    
    const participant = await prisma.chatRoomParticipant.create({
      data: {
        userId: 1,
        chatRoomId: 4
      }
    });
    
    console.log('✅ User 1 added to chat room 4');
    console.log('Participant ID:', participant.id);
    
    // Verify the fix
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
    
    console.log('\n✅ Chat room 4 now has participants:');
    room4.participants.forEach(participant => {
      console.log(`   - User ${participant.user.id}: ${participant.user.name} (${participant.user.role})`);
    });
    
    console.log('\n🎉 Chat room 4 is now fixed!');
    console.log('💡 You can now use chat room 4 in your frontend');
    
  } catch (error) {
    console.error('❌ Error fixing room 4:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoom4();
