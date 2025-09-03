const { PrismaClient } = require('@prisma/client');

async function checkOriginalData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING YOUR ORIGINAL TRAINING DATA...\n');
    
    // Check training modules in detail
    console.log('📚 TRAINING MODULES DETAIL:');
    const modules = await prisma.trainingModule.findMany({
      include: {
        company: true,
        videos: true,
        mcqs: true,
        traineeProgress: true
      }
    });
    
    modules.forEach((module, index) => {
      console.log(`\n${index + 1}. ${module.name}`);
      console.log(`   Company: ${module.company.name}`);
      console.log(`   Videos: ${module.videos.length}`);
      console.log(`   MCQs: ${module.mcqs.length}`);
      console.log(`   Progress Records: ${module.traineeProgress.length}`);
      
      if (module.videos.length > 0) {
        console.log('   🎥 Videos:');
        module.videos.forEach(video => {
          console.log(`      - ${video.url} (${Math.floor(video.duration/60)} minutes)`);
        });
      }
      
      if (module.mcqs.length > 0) {
        console.log('   ❓ MCQs:');
        module.mcqs.forEach(mcq => {
          console.log(`      - Q: ${mcq.question}`);
          console.log(`        A: ${mcq.answer}`);
          console.log(`        Options: ${mcq.options.join(', ')}`);
        });
      }
    });
    
    // Check if there are other companies with training content
    console.log('\n🏢 COMPANIES WITH TRAINING CONTENT:');
    const companiesWithModules = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            trainingModules: true,
            users: true
          }
        }
      }
    });
    
    companiesWithModules.forEach(company => {
      console.log(`   ${company.name}: ${company._count.trainingModules} modules, ${company._count.users} users`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Original data check completed');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkOriginalData();
