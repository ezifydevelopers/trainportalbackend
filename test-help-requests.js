const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHelpRequests() {
  try {
    console.log('Testing help request functionality...');
    
    // Test 1: Check if HelpRequest table exists
    console.log('\n1. Checking if HelpRequest table exists...');
    const helpRequests = await prisma.helpRequest.findMany();
    console.log('Found help requests:', helpRequests.length);
    
    // Test 1.5: Check for existing trainees
    console.log('\n1.5. Checking for existing trainees...');
    const trainees = await prisma.user.findMany({
      where: { role: 'TRAINEE' },
      select: { id: true, name: true, email: true }
    });
    console.log('Found trainees:', trainees);
    
    if (trainees.length === 0) {
      console.log('❌ No trainees found. Please create a trainee first.');
      return;
    }
    
    const traineeId = trainees[0].id;
    console.log(`Using trainee ID: ${traineeId} (${trainees[0].name})`);
    
    // Test 2: Create a test help request
    console.log('\n2. Creating a test help request...');
    const testRequest = await prisma.helpRequest.create({
      data: {
        traineeId: traineeId,
        message: 'Test help request from script',
        status: 'PENDING'
      },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    console.log('Created test help request:', testRequest);
    
    // Test 3: Fetch all help requests
    console.log('\n3. Fetching all help requests...');
    const allRequests = await prisma.helpRequest.findMany({
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    console.log('All help requests:', allRequests);
    
    // Test 4: Update the test request
    console.log('\n4. Updating test help request...');
    const updatedRequest = await prisma.helpRequest.update({
      where: { id: testRequest.id },
      data: {
        status: 'IN_PROGRESS',
        adminNotes: 'Test admin notes'
      },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    console.log('Updated help request:', updatedRequest);
    
    console.log('\n✅ All tests passed! Help request functionality is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHelpRequests(); 