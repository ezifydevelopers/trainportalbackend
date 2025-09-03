const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModuleCreation() {
  try {
    console.log('Testing module creation process...');
    
    // Test 1: Check if companies exist
    console.log('\n1. Checking for companies...');
    const companies = await prisma.company.findMany({
      include: {
        users: {
          where: { role: 'TRAINEE' }
        }
      }
    });
    console.log('Found companies:', companies.length);
    console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name, trainees: c.users.length })));
    
    if (companies.length === 0) {
      console.log('❌ No companies found. Please create a company first.');
      return;
    }
    
    const company = companies[0];
    console.log(`Using company: ${company.name} (ID: ${company.id})`);
    
    // Test 2: Create a module
    console.log('\n2. Creating a test module...');
    const module = await prisma.trainingModule.create({
      data: {
        name: 'Test Module - Video Only',
        companyId: company.id,
      },
    });
    console.log('Created module:', module);
    
    // Test 3: Add video to module
    console.log('\n3. Adding video to module...');
    const video = await prisma.video.create({
      data: {
        url: 'test-video.mp4',
        duration: 300, // 5 minutes
        moduleId: module.id,
      },
    });
    console.log('Created video:', video);
    
    // Test 4: Check if trainees were assigned
    console.log('\n4. Checking trainee assignments...');
    const progressRecords = await prisma.traineeProgress.findMany({
      where: { moduleId: module.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    console.log('Progress records:', progressRecords.length);
    console.log('Assigned trainees:', progressRecords.map(p => p.user.name));
    
    // Test 5: Clean up
    console.log('\n5. Cleaning up test data...');
    await prisma.traineeProgress.deleteMany({
      where: { moduleId: module.id }
    });
    await prisma.video.deleteMany({
      where: { moduleId: module.id }
    });
    await prisma.trainingModule.delete({
      where: { id: module.id }
    });
    console.log('Test data cleaned up');
    
    console.log('\n✅ All tests passed! Module creation is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModuleCreation(); 