const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    console.log('Users found:', users.length);
    console.log('Users:', users);
    
    // Test 2: Check help requests
    const helpRequests = await prisma.helpRequest.findMany();
    console.log('Help requests found:', helpRequests.length);
    console.log('Help requests:', helpRequests);
    
    // Test 3: Check if we can create a help request
    const trainees = users.filter(u => u.role === 'TRAINEE');
    console.log('Trainees found:', trainees.length);
    
    if (trainees.length > 0) {
      console.log('Creating test help request...');
      const testRequest = await prisma.helpRequest.create({
        data: {
          traineeId: trainees[0].id,
          message: 'Test help request',
          status: 'PENDING'
        }
      });
      console.log('Created help request:', testRequest);
      
      // Clean up
      await prisma.helpRequest.delete({
        where: { id: testRequest.id }
      });
      console.log('Cleaned up test help request');
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 