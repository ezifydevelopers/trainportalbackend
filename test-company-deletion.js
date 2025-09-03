const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompanyDeletion() {
  try {
    console.log('Testing company deletion functionality...');
    
    // First, let's check what companies exist
    const companies = await prisma.company.findMany({
      include: {
        users: true,
        modules: {
          include: {
            videos: true,
            mcqs: true
          }
        }
      }
    });
    
    console.log(`Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`- Company: ${company.name} (ID: ${company.id})`);
      console.log(`  - Users: ${company.users.length}`);
      console.log(`  - Modules: ${company.modules.length}`);
      company.modules.forEach(module => {
        console.log(`    - Module: ${module.name} (ID: ${module.id})`);
        console.log(`      - Videos: ${module.videos.length}`);
        console.log(`      - MCQs: ${module.mcqs.length}`);
      });
    });
    
    if (companies.length === 0) {
      console.log('No companies found to test deletion');
      return;
    }
    
    // Test with the first company
    const testCompany = companies[0];
    console.log(`\nTesting deletion of company: ${testCompany.name} (ID: ${testCompany.id})`);
    
    // Check for any foreign key constraints
    console.log('\nChecking for potential foreign key constraint issues...');
    
    // Check notifications
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          user: {
            companyId: testCompany.id
          }
        }
      });
      console.log(`- Notifications: ${notifications.length}`);
    } catch (error) {
      console.log(`- Notifications table error: ${error.message}`);
    }
    
    // Check feedback
    try {
      const feedback = await prisma.feedback.findMany({
        where: {
          user: {
            companyId: testCompany.id
          }
        }
      });
      console.log(`- Feedback: ${feedback.length}`);
    } catch (error) {
      console.log(`- Feedback table error: ${error.message}`);
    }
    
    // Check help requests
    try {
      const helpRequests = await prisma.helpRequest.findMany({
        where: {
          trainee: {
            companyId: testCompany.id
          }
        }
      });
      console.log(`- Help requests: ${helpRequests.length}`);
    } catch (error) {
      console.log(`- Help requests table error: ${error.message}`);
    }
    
    // Check chat rooms
    try {
      const chatRooms = await prisma.chatRoom.findMany({
        where: {
          companyId: testCompany.id
        }
      });
      console.log(`- Chat rooms: ${chatRooms.length}`);
    } catch (error) {
      console.log(`- Chat rooms table error: ${error.message}`);
    }
    
    // Check chat messages
    try {
      const chatMessages = await prisma.chatMessage.findMany({
        where: {
          chatRoom: {
            companyId: testCompany.id
          }
        }
      });
      console.log(`- Chat messages: ${chatMessages.length}`);
    } catch (error) {
      console.log(`- Chat messages table error: ${error.message}`);
    }
    
    // Check chat room participants
    try {
      const chatParticipants = await prisma.chatRoomParticipant.findMany({
        where: {
          chatRoom: {
            companyId: testCompany.id
          }
        }
      });
      console.log(`- Chat room participants: ${chatParticipants.length}`);
    } catch (error) {
      console.log(`- Chat room participants table error: ${error.message}`);
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyDeletion();
