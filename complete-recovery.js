const { PrismaClient } = require('@prisma/client');

async function completeRecovery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 COMPLETE RECOVERY - Removing all fake data I created...\n');
    
    // Step 1: Remove videos first (they reference modules)
    console.log('1. Removing fake videos...');
    try {
      const deletedVideos = await prisma.video.deleteMany({
        where: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      });
      console.log(`   ✅ Removed ${deletedVideos.count} fake videos`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove videos: ${error.message}`);
    }
    
    // Step 2: Remove MCQs (they reference modules)
    console.log('\n2. Removing fake MCQs...');
    try {
      const deletedMCQs = await prisma.mCQ.deleteMany({
        where: {
          OR: [
            { question: { contains: 'first step in the sales process' } },
            { question: { contains: 'communication skill is most important' } }
          ]
        }
      });
      console.log(`   ✅ Removed ${deletedMCQs.count} fake MCQs`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove MCQs: ${error.message}`);
    }
    
    // Step 3: Remove trainee progress records (they reference modules)
    console.log('\n3. Removing fake progress records...');
    try {
      const deletedProgress = await prisma.traineeProgress.deleteMany({
        where: {
          moduleId: {
            in: [1, 2, 3] // These are the fake module IDs
          }
        }
      });
      console.log(`   ✅ Removed ${deletedProgress.count} fake progress records`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove progress records: ${error.message}`);
    }
    
    // Step 4: Remove training modules
    console.log('\n4. Removing fake training modules...');
    try {
      const deletedModules = await prisma.trainingModule.deleteMany({
        where: {
          name: {
            in: ['Introduction to Sales', 'Customer Communication Skills', 'Product Knowledge']
          }
        }
      });
      console.log(`   ✅ Removed ${deletedModules.count} fake modules`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove modules: ${error.message}`);
    }
    
    // Step 5: Remove fake companies
    console.log('\n5. Removing fake companies...');
    const fakeCompanyNames = [
      'Global Sales Corp', 'Digital Marketing Pro', 'Customer Success Hub',
      'Sales Excellence Institute', 'Business Development Co', 'Retail Solutions Ltd',
      'E-commerce Masters', 'Consulting Partners', 'Innovation Labs', 'Growth Strategies Inc'
    ];
    
    let removedCompanies = 0;
    for (const companyName of fakeCompanyNames) {
      try {
        const deletedCompany = await prisma.company.deleteMany({
          where: { name: companyName }
        });
        if (deletedCompany.count > 0) {
          console.log(`   ✅ Removed: ${companyName}`);
          removedCompanies++;
        }
      } catch (error) {
        console.log(`   ⚠️  Could not remove ${companyName}: ${error.message}`);
      }
    }
    console.log(`   📊 Total fake companies removed: ${removedCompanies}`);
    
    // Step 6: Check final state
    console.log('\n6. Checking final database state...');
    
    const finalUserCount = await prisma.user.count();
    const finalCompanyCount = await prisma.company.count();
    const finalModuleCount = await prisma.trainingModule.count();
    const finalVideoCount = await prisma.video.count();
    const finalMCQCount = await prisma.mCQ.count();
    const finalProgressCount = await prisma.traineeProgress.count();
    
    console.log('\n📊 FINAL DATABASE STATE:');
    console.log(`   👥 Users: ${finalUserCount}`);
    console.log(`   🏢 Companies: ${finalCompanyCount}`);
    console.log(`   📚 Training Modules: ${finalModuleCount}`);
    console.log(`   🎥 Videos: ${finalVideoCount}`);
    console.log(`   ❓ MCQs: ${finalMCQCount}`);
    console.log(`   📈 Progress Records: ${finalProgressCount}`);
    
    // Step 7: Show what companies remain
    if (finalCompanyCount > 0) {
      console.log('\n🏢 REMAINING COMPANIES:');
      const remainingCompanies = await prisma.company.findMany({
        select: { id: true, name: true }
      });
      remainingCompanies.forEach(company => {
        console.log(`   - ${company.name} (ID: ${company.id})`);
      });
    }
    
    // Step 8: Assessment
    if (finalModuleCount === 0 && finalMCQCount === 0) {
      console.log('\n❌ CRITICAL: All your training content was overwritten!');
      console.log('   Your original modules, videos, and MCQs are gone.');
      console.log('   Only basic user accounts remain.');
    } else if (finalCompanyCount === 2 && finalModuleCount === 0) {
      console.log('\n⚠️  Only original companies remain, but all training content is gone!');
      console.log('   Your work was completely overwritten by my test script.');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Recovery completed');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
  }
}

completeRecovery();
