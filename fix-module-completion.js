const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixModuleCompletion() {
  try {
    console.log('=== FIXING MODULE COMPLETION STATUS ===');
    
    // Get all trainee progress records
    const progressRecords = await prisma.traineeProgress.findMany({
      include: {
        module: {
          include: {
            mcqs: true
          }
        },
        mcqAnswers: true
      }
    });
    
    console.log(`Found ${progressRecords.length} progress records`);
    
    let fixedCount = 0;
    
    for (const progress of progressRecords) {
      const hasMCQs = progress.module.mcqs && progress.module.mcqs.length > 0;
      const hasQuizAnswers = progress.mcqAnswers && progress.mcqAnswers.length > 0;
      const isCompleted = progress.completed;
      const isPassed = progress.pass;
      
      // Check for issues that need fixing
      if (hasMCQs && isCompleted && !hasQuizAnswers) {
        console.log(`\n🔧 FIXING: Module "${progress.module.name}" (ID: ${progress.moduleId})`);
        console.log(`  - Has MCQs but no quiz answers, yet marked as completed`);
        console.log(`  - Setting completed: false, pass: false, score: 0`);
        
        // Fix the data
        await prisma.traineeProgress.update({
          where: { id: progress.id },
          data: {
            completed: false,
            pass: false,
            score: 0
          }
        });
        
        fixedCount++;
      } else if (hasMCQs && isPassed && !hasQuizAnswers) {
        console.log(`\n🔧 FIXING: Module "${progress.module.name}" (ID: ${progress.moduleId})`);
        console.log(`  - Has MCQs but no quiz answers, yet marked as passed`);
        console.log(`  - Setting pass: false, score: 0`);
        
        // Fix the data
        await prisma.traineeProgress.update({
          where: { id: progress.id },
          data: {
            pass: false,
            score: 0
          }
        });
        
        fixedCount++;
      } else if (!hasMCQs && isCompleted && !isPassed) {
        console.log(`\n🔧 FIXING: Module "${progress.module.name}" (ID: ${progress.moduleId})`);
        console.log(`  - No MCQs, completed but not passed`);
        console.log(`  - Setting pass: true, score: 100`);
        
        // Fix the data
        await prisma.traineeProgress.update({
          where: { id: progress.id },
          data: {
            pass: true,
            score: 100
          }
        });
        
        fixedCount++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total progress records: ${progressRecords.length}`);
    console.log(`Fixed records: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ Successfully fixed ${fixedCount} module completion issues!`);
    } else {
      console.log(`\n✅ No issues found - all module completion statuses are correct!`);
    }
    
  } catch (error) {
    console.error('Error fixing module completion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixModuleCompletion(); 