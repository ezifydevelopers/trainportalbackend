const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testGetModule() {
  try {
    // Get the first trainee
    const trainee = await prisma.user.findFirst({
      where: { role: 'TRAINEE' }
    });

    if (!trainee) {
      console.log('No trainee found');
      return;
    }

    // Get the first module for this trainee
    const progress = await prisma.traineeProgress.findFirst({
      where: { userId: trainee.id },
      include: {
        module: {
          include: {
            video: true,
            mcqs: true
          }
        }
      }
    });

    if (!progress) {
      console.log('No progress record found for trainee');
      return;
    }

    console.log(`Testing getModule for trainee: ${trainee.name} (ID: ${trainee.id})`);
    console.log(`Module ID: ${progress.moduleId}`);
    console.log(`Module Name: ${progress.module.name}`);

    // Test the getModule logic directly
    const testProgress = await prisma.traineeProgress.findFirst({
      where: {
        userId: trainee.id,
        moduleId: progress.moduleId
      },
      include: {
        module: {
          include: {
            video: true,
            mcqs: true
          }
        }
      }
    });

    if (testProgress) {
      console.log('\n✅ getModule test successful!');
      console.log('Module data:');
      console.log(JSON.stringify({
        id: testProgress.module.id,
        name: testProgress.module.name,
        video: testProgress.module.video ? {
          id: testProgress.module.video.id,
          duration: testProgress.module.video.duration
        } : null,
        mcqsCount: testProgress.module.mcqs.length,
        mcqs: testProgress.module.mcqs.map(mcq => ({
          id: mcq.id,
          question: mcq.question.substring(0, 50) + '...',
          options: mcq.options
        }))
      }, null, 2));
    } else {
      console.log('\n❌ getModule test failed - no module found');
    }

  } catch (error) {
    console.error('Error testing getModule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGetModule(); 