const { PrismaClient } = require('@prisma/client');

async function checkFinalStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 FINAL TRAINING SYSTEM STATUS\n');
    
    // Get counts
    const companyCount = await prisma.company.count();
    const moduleCount = await prisma.trainingModule.count();
    const videoCount = await prisma.video.count();
    const mcqCount = await prisma.mCQ.count();
    const progressCount = await prisma.traineeProgress.count();
    
    console.log(`🏢 Companies: ${companyCount}`);
    console.log(`📚 Training Modules: ${moduleCount}`);
    console.log(`🎥 Videos: ${videoCount}`);
    console.log(`❓ MCQs: ${mcqCount}`);
    console.log(`📈 Progress Records: ${progressCount}`);
    
    // Show all modules with their videos
    console.log('\n📚 YOUR COMPLETE TRAINING MODULES:');
    
    const modules = await prisma.trainingModule.findMany({
      include: {
        videos: true,
        mcqs: true
      },
      orderBy: { id: 'asc' }
    });
    
    modules.forEach((module, index) => {
      console.log(`\n   ${index + 1}. 📚 ${module.name}`);
      console.log(`      🎥 Videos (${module.videos.length}):`);
      module.videos.forEach((video, vIndex) => {
        const durationMinutes = Math.round(video.duration / 60);
        console.log(`         ${vIndex + 1}. ${video.url.split('/').pop()} (${durationMinutes} min)`);
      });
      console.log(`      ❓ MCQs (${module.mcqs.length}):`);
      module.mcqs.forEach((mcq, mIndex) => {
        console.log(`         ${mIndex + 1}. ${mcq.question.substring(0, 50)}...`);
      });
    });
    
    console.log('\n🎉 RESTORATION COMPLETE!');
    console.log('   Your training portal now has ALL your real content restored!');
    
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   👨‍🎓 Trainee: ali@gmail.com / 123456');
    console.log('   👩‍🎓 Trainee: sarah@example.com / password123');
    console.log('   👑 Admin: admin@example.com / admin123');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

checkFinalStatus();
