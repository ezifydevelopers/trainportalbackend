const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteModule() {
  try {
    console.log('=== TESTING MODULE DELETION ===');
    
    // First, let's check what modules exist
    const modules = await prisma.trainingModule.findMany({
      include: {
        mcqs: true,
        video: true,
        progress: true,
        mcqAnswers: true,
        helpRequests: true,
        feedback: true
      }
    });
    
    console.log('Available modules:', modules.map(m => ({
      id: m.id,
      name: m.name,
      mcqsCount: m.mcqs.length,
      hasVideo: !!m.video,
      progressCount: m.progress.length,
      mcqAnswersCount: m.mcqAnswers.length,
      helpRequestsCount: m.helpRequests.length,
      feedbackCount: m.feedback.length
    })));
    
    if (modules.length === 0) {
      console.log('No modules found to test deletion');
      return;
    }
    
    const testModule = modules[0];
    console.log('Testing deletion of module:', testModule.name);
    
    // Test the deletion process step by step
    console.log('\n=== STEP-BY-STEP DELETION TEST ===');
    
    // 1. Delete MCQ answers
    console.log('1. Deleting MCQ answers...');
    const deletedAnswers = await prisma.mCQAnswer.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted MCQ answers:', deletedAnswers.count);
    
    // 2. Delete MCQs
    console.log('2. Deleting MCQs...');
    const deletedMCQs = await prisma.mCQ.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted MCQs:', deletedMCQs.count);
    
    // 3. Delete video
    console.log('3. Deleting video...');
    const deletedVideos = await prisma.video.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted videos:', deletedVideos.count);
    
    // 4. Delete progress
    console.log('4. Deleting progress records...');
    const deletedProgress = await prisma.traineeProgress.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted progress records:', deletedProgress.count);
    
    // 5. Delete help requests
    console.log('5. Deleting help requests...');
    const deletedHelpRequests = await prisma.helpRequest.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted help requests:', deletedHelpRequests.count);
    
    // 6. Delete feedback
    console.log('6. Deleting feedback...');
    const deletedFeedback = await prisma.feedback.deleteMany({
      where: { moduleId: testModule.id }
    });
    console.log('Deleted feedback:', deletedFeedback.count);
    
    // 7. Finally delete the module
    console.log('7. Deleting module...');
    await prisma.trainingModule.delete({
      where: { id: testModule.id }
    });
    console.log('Module deleted successfully!');
    
    console.log('\n=== DELETION TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('=== DELETION TEST FAILED ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteModule(); 