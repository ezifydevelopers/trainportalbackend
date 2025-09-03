const prisma = require('./src/prismaClient');

async function testChatFunctionality() {
  try {
    console.log('🧪 Testing Chat Functionality...\n');

    // Test 1: Check if chat models exist
    console.log('1. Checking chat models...');
    const chatRooms = await prisma.chatRoom.findMany();
    const chatMessages = await prisma.chatMessage.findMany();
    const chatParticipants = await prisma.chatRoomParticipant.findMany();
    
    console.log(`   - Chat Rooms: ${chatRooms.length}`);
    console.log(`   - Chat Messages: ${chatMessages.length}`);
    console.log(`   - Chat Participants: ${chatParticipants.length}`);

    // Test 2: Check if users exist
    console.log('\n2. Checking users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true
      }
    });
    
    console.log(`   - Total Users: ${users.length}`);
    users.forEach(user => {
      console.log(`     - ${user.name} (${user.role}) - Company ID: ${user.companyId}`);
    });

    // Test 3: Check if companies exist
    console.log('\n3. Checking companies...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`   - Total Companies: ${companies.length}`);
    companies.forEach(company => {
      console.log(`     - ${company.name} (ID: ${company.id})`);
    });

    // Test 4: Test creating a chat room (if users exist)
    if (users.length >= 2 && companies.length > 0) {
      console.log('\n4. Testing chat room creation...');
      
      const user1 = users[0];
      const user2 = users[1];
      const company = companies[0];
      
      console.log(`   - Creating chat between ${user1.name} and ${user2.name}`);
      
      const chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          companyId: company.id,
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

      // Test 5: Test sending a message
      console.log('\n5. Testing message sending...');
      
      const message = await prisma.chatMessage.create({
        data: {
          content: 'Hello! This is a test message.',
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
      
      console.log(`   ✅ Message sent with ID: ${message.id}`);
      console.log(`   - Content: "${message.content}"`);
      console.log(`   - Sender: ${message.sender.name}`);

      // Test 6: Test retrieving messages
      console.log('\n6. Testing message retrieval...');
      
      const messages = await prisma.chatMessage.findMany({
        where: {
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
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      console.log(`   ✅ Retrieved ${messages.length} messages`);
      messages.forEach(msg => {
        console.log(`     - ${msg.sender.name}: "${msg.content}"`);
      });

      // Clean up test data
      console.log('\n7. Cleaning up test data...');
      await prisma.chatMessage.deleteMany({
        where: { chatRoomId: chatRoom.id }
      });
      await prisma.chatRoomParticipant.deleteMany({
        where: { chatRoomId: chatRoom.id }
      });
      await prisma.chatRoom.delete({
        where: { id: chatRoom.id }
      });
      console.log('   ✅ Test data cleaned up');

    } else {
      console.log('\n4. Skipping chat room creation test (need at least 2 users and 1 company)');
    }

    console.log('\n🎉 Chat functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing chat functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatFunctionality();
