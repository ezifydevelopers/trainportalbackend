const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFeedback() {
  try {
    console.log('Testing feedback functionality...');
    
    // Check if feedback table exists and has data
    const feedbackCount = await prisma.feedback.count();
    console.log(`Total feedback records: ${feedbackCount}`);
    
    if (feedbackCount > 0) {
      // Get a sample feedback record
      const sampleFeedback = await prisma.feedback.findFirst({
        include: {
          user: true,
          module: true
        }
      });
      
      console.log('Sample feedback:', {
        id: sampleFeedback.id,
        rating: sampleFeedback.rating,
        comment: sampleFeedback.comment,
        userId: sampleFeedback.userId,
        moduleId: sampleFeedback.moduleId,
        user: sampleFeedback.user?.name,
        module: sampleFeedback.module?.name
      });
    }
    
    // Test feedback stats
    try {
      const totalFeedback = await prisma.feedback.count();
      const averageRating = await prisma.feedback.aggregate({
        _avg: {
          rating: true
        }
      });
      
      console.log('Feedback stats:', {
        total: totalFeedback,
        averageRating: averageRating._avg.rating
      });
    } catch (error) {
      console.log('Error getting feedback stats:', error.message);
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    
    // Check if it's a table not found error
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('The feedback table does not exist. This might be the issue.');
      console.log('You may need to run database migrations.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testFeedback();
