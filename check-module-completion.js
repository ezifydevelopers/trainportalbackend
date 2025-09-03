const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModuleCompletion() {
  try {
    console.log('=== CHECKING MODULE COMPLETION STATUS ===');
    
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
    
    let issuesFound = 0;
    
    for (const progress of progressRecords) {
      const hasMCQs = progress.module.mcqs && progress.module.mcqs.length > 0;
      const hasQuizAnswers = progress.mcqAnswers && progress.mcqAnswers.length > 0;
      const isCompleted = progress.completed;
      const isPassed = progress.pass;
      
      console.log(`\nModule: ${progress.module.name} (ID: ${progress.moduleId})`);
      console.log(`  - Has MCQs: ${hasMCQs} (${progress.module.mcqs?.length || 0} questions)`);
      console.log(`  - Has quiz answers: ${hasQuizAnswers} (${progress.mcqAnswers?.length || 0} answers)`);
      console.log(`  - Is completed: ${isCompleted}`);
      console.log(`  - Is passed: ${isPassed}`);
      console.log(`  - Score: ${progress.score || 0}%`);
      
      // Check for issues
      if (hasMCQs && isCompleted && !hasQuizAnswers) {
        console.log(`  ❌ ISSUE: Module has MCQs, is marked as completed, but has no quiz answers!`);
        issuesFound++;
        
        // Ask if user wants to fix this
        console.log(`  🔧 This module should not be marked as completed.`);
        console.log(`  🔧 It should only be completed after passing the quiz.`);
      } else if (hasMCQs && isPassed && !hasQuizAnswers) {
        console.log(`  ❌ ISSUE: Module has MCQs, is marked as passed, but has no quiz answers!`);
        issuesFound++;
      } else if (!hasMCQs && isCompleted && !isPassed) {
        console.log(`  ❌ ISSUE: Module has no MCQs, is completed but not passed!`);
        issuesFound++;
      } else if (hasMCQs && hasQuizAnswers && isCompleted && !isPassed) {
        console.log(`  ⚠️  WARNING: Module has MCQs, has answers, is completed but not passed.`);
        console.log(`  ⚠️  This might be correct if the user failed the quiz.`);
      } else {
        console.log(`  ✅ Status looks correct`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total progress records: ${progressRecords.length}`);
    console.log(`Issues found: ${issuesFound}`);
    
    if (issuesFound > 0) {
      console.log(`\n🔧 RECOMMENDATION: Run a fix script to correct these issues.`);
    } else {
      console.log(`\n✅ All module completion statuses look correct!`);
    }
    
  } catch (error) {
    console.error('Error checking module completion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModuleCompletion(); 