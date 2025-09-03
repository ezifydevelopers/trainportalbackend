const { PrismaClient } = require('@prisma/client');

async function checkRealData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 CHECKING WHAT HAPPENED TO YOUR REAL DATA...\n');
    
    // Check all tables with detailed counts
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const moduleCount = await prisma.trainingModule.count();
    const videoCount = await prisma.video.count();
    const mcqCount = await prisma.mCQ.count();
    const progressCount = await prisma.traineeProgress.count();
    
    console.log('📊 CURRENT DATABASE STATE:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏢 Companies: ${companyCount}`);
    console.log(`   📚 Training Modules: ${moduleCount}`);
    console.log(`   🎥 Videos: ${videoCount}`);
    console.log(`   ❓ MCQs: ${mcqCount}`);
    console.log(`   📈 Progress Records: ${progressCount}`);
    
    // Check if this looks like the test data I created
    if (moduleCount === 3 && mcqCount === 2) {
      console.log('\n⚠️  WARNING: This looks like the test data I created, not your real work!');
      console.log('   - Only 3 modules (should be many more)');
      console.log('   - Only 2 MCQs (should be many more)');
      console.log('   - This suggests your real data was overwritten');
    }
    
    // Show all companies to see if they're the fake ones I added
    console.log('\n🏢 ALL COMPANIES (check if these are your real ones):');
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });
    
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
    });
    
    // Check if companies look fake
    const fakeCompanyNames = [
      'Global Sales Corp', 'Digital Marketing Pro', 'Customer Success Hub',
      'Sales Excellence Institute', 'Business Development Co', 'Retail Solutions Ltd',
      'E-commerce Masters', 'Consulting Partners', 'Innovation Labs', 'Growth Strategies Inc'
    ];
    
    const fakeCompaniesFound = companies.filter(c => fakeCompanyNames.includes(c.name));
    if (fakeCompaniesFound.length > 0) {
      console.log('\n❌ CONFIRMED: I accidentally added fake companies that overwrote your real ones!');
      console.log(`   Found ${fakeCompaniesFound.length} fake companies I created`);
    }
    
    // Show all modules to see what's there
    if (moduleCount > 0) {
      console.log('\n📚 TRAINING MODULES:');
      const modules = await prisma.trainingModule.findMany({
        select: { id: true, name: true, companyId: true }
      });
      modules.forEach(module => {
        console.log(`   - ${module.name} (Company ID: ${module.companyId})`);
      });
    }
    
    // Show all MCQs
    if (mcqCount > 0) {
      console.log('\n❓ MCQs:');
      const mcqs = await prisma.mCQ.findMany({
        select: { id: true, question: true, moduleId: true }
      });
      mcqs.forEach(mcq => {
        console.log(`   - MCQ ${mcq.id}: ${mcq.question.substring(0, 60)}...`);
      });
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Data check completed');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkRealData();
