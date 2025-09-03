const prisma = require('./src/prismaClient');

async function testChatAPI() {
  try {
    console.log('🧪 Testing Chat API Endpoints...\n');

    // Test 1: Check users and companies
    console.log('1. Checking database content...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`   - Total Users: ${users.length}`);
    users.forEach(user => {
      console.log(`     - ${user.name} (${user.email}) - Role: ${user.role} - Company: ${user.company?.name || 'None'}`);
    });

    // Test 2: Check if we can create a chat room
    if (users.length >= 2) {
      console.log('\n2. Testing chat room creation...');
      
      const user1 = users[0];
      const user2 = users[1];
      
      if (user1.companyId && user2.companyId && user1.companyId === user2.companyId) {
        console.log(`   - Creating chat between ${user1.name} and ${user2.name}`);
        
        const chatRoom = await prisma.chatRoom.create({
          data: {
            type: 'DIRECT',
            companyId: user1.companyId,
            participants: {
              create: [
                { userId: user1.id },
                { userId: user2.id }
              ]
            }
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        });
        
        console.log(`   ✅ Chat room created with ID: ${chatRoom.id}`);
        console.log(`   - Participants: ${chatRoom.participants.map(p => p.user.name).join(', ')}`);

        // Test 3: Test sending a message
        console.log('\n3. Testing message sending...');
        
        const message = await prisma.chatMessage.create({
          data: {
            content: 'Hello! This is a test message from the API test.',
            senderId: user1.id,
            receiverId: user2.id,
            chatRoomId: chatRoom.id
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });
        
        console.log(`   ✅ Message sent successfully`);
        console.log(`   - Content: "${message.content}"`);
        console.log(`   - From: ${message.sender.name}`);
        console.log(`   - To: ${user2.name}`);

        // Clean up test data
        console.log('\n4. Cleaning up test data...');
        await prisma.chatMessage.delete({ where: { id: message.id } });
        await prisma.chatRoomParticipant.deleteMany({ where: { chatRoomId: chatRoom.id } });
        await prisma.chatRoom.delete({ where: { id: chatRoom.id } });
        console.log('   ✅ Test data cleaned up');
        
      } else {
        console.log('   ⚠️  Users must belong to the same company to test chat');
      }
    }

    console.log('\n✅ Chat API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Chat API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatAPI();
