const { PrismaClient } = require('@prisma/client');

async function recoveryPlan() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 RECOVERY PLAN - Trying to restore your original data...\n');
    
    // Step 1: Remove the fake companies I added
    console.log('1. Removing fake companies I accidentally added...');
    
    const fakeCompanyNames = [
      'Global Sales Corp', 'Digital Marketing Pro', 'Customer Success Hub',
      'Sales Excellence Institute', 'Business Development Co', 'Retail Solutions Ltd',
      'E-commerce Masters', 'Consulting Partners', 'Innovation Labs', 'Growth Strategies Inc'
    ];
    
    let removedCount = 0;
    for (const companyName of fakeCompanyNames) {
      try {
        const deletedCompany = await prisma.company.deleteMany({
          where: { name: companyName }
        });
        if (deletedCompany.count > 0) {
          console.log(`   ✅ Removed: ${companyName}`);
          removedCount++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not remove ${companyName}: ${error.message}`);
      }
    }
    
    console.log(`   📊 Removed ${removedCount} fake companies`);
    
    // Step 2: Remove fake training modules
    console.log('\n2. Removing fake training modules...');
    
    const fakeModuleNames = [
      'Introduction to Sales', 'Customer Communication Skills', 'Product Knowledge'
    ];
    
    let removedModules = 0;
    for (const moduleName of fakeModuleNames) {
      try {
        const deletedModule = await prisma.trainingModule.deleteMany({
          where: { name: moduleName }
        });
        if (deletedModule.count > 0) {
          console.log(`   ✅ Removed: ${moduleName}`);
          removedModules++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not remove ${moduleName}: ${error.message}`);
      }
    }
    
    console.log(`   📊 Removed ${removedModules} fake modules`);
    
    // Step 3: Remove fake MCQs
    console.log('\n3. Removing fake MCQs...');
    
    const fakeMCQQuestions = [
      'What is the first step in the sales process?',
      'Which communication skill is most important in sales?'
    ];
    
    let removedMCQs = 0;
    for (const question of fakeMCQQuestions) {
      try {
        const deletedMCQ = await prisma.mCQ.deleteMany({
          where: { question: { contains: question.substring(0, 20) } }
        });
        if (deletedMCQ.count > 0) {
          console.log(`   ✅ Removed MCQ: ${question.substring(0, 30)}...`);
          removedMCQs++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not remove MCQ: ${error.message}`);
      }
    }
    
    console.log(`   📊 Removed ${removedMCQs} fake MCQs`);
    
    // Step 4: Check what's left
    console.log('\n4. Checking what remains in database...');
    
    const remainingCompanies = await prisma.company.count();
    const remainingModules = await prisma.trainingModule.count();
    const remainingMCQs = await prisma.mCQ.count();
    
    console.log(`   🏢 Companies remaining: ${remainingCompanies}`);
    console.log(`   📚 Modules remaining: ${remainingModules}`);
    console.log(`   ❓ MCQs remaining: ${remainingMCQs}`);
    
    if (remainingCompanies === 0 && remainingModules === 0 && remainingMCQs === 0) {
      console.log('\n❌ CRITICAL: All data was removed! Your original work is gone!');
      console.log('   This means the script completely overwrote your database.');
    } else if (remainingCompanies === 2 && remainingModules === 0) {
      console.log('\n⚠️  Only original companies remain, but all training content is gone!');
      console.log('   Your modules, videos, and MCQs were overwritten.');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Recovery attempt completed');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
  }
}

recoveryPlan();
