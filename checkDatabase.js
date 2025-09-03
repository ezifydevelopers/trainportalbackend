const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database state...\n');

    // Check companies
    const companies = await prisma.company.findMany();
    console.log(`Companies: ${companies.length}`);
    companies.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));

    // Check trainees
    const trainees = await prisma.user.findMany({
      where: { role: 'TRAINEE' },
      include: { company: true }
    });
    console.log(`\nTrainees: ${trainees.length}`);
    trainees.forEach(t => console.log(`  - ${t.name} (${t.email}) - Company: ${t.company?.name || 'None'} (ID: ${t.id})`));

    // Check modules
    const modules = await prisma.trainingModule.findMany({
      include: { company: true }
    });
    console.log(`\nModules: ${modules.length}`);
    modules.forEach(m => console.log(`  - ${m.name} (ID: ${m.id}) - Company: ${m.company.name} (ID: ${m.companyId})`));

    // Check trainee progress
    const progress = await prisma.traineeProgress.findMany({
      include: {
        user: true,
        module: true
      }
    });
    console.log(`\nTrainee Progress Records: ${progress.length}`);
    progress.forEach(p => {
      console.log(`  - ${p.user.name} (ID: ${p.userId}) -> ${p.module.name} (ID: ${p.moduleId}) (Completed: ${p.completed}, Pass: ${p.pass}, Score: ${p.score || 'N/A'})`);
    });

    // Check specific trainee progress for the first trainee
    if (trainees.length > 0) {
      const firstTrainee = trainees[0];
      console.log(`\nDetailed progress for ${firstTrainee.name}:`);
      const traineeProgress = await prisma.traineeProgress.findMany({
        where: { userId: firstTrainee.id },
        include: {
          module: {
            include: { company: true }
          }
        },
        orderBy: { moduleId: 'asc' }
      });
      
      traineeProgress.forEach((p, index) => {
        const isUnlocked = index === 0 || 
          (index > 0 && traineeProgress[index - 1].completed && traineeProgress[index - 1].pass);
        console.log(`  Module ${index + 1}: ${p.module.name} - Unlocked: ${isUnlocked}, Completed: ${p.completed}, Pass: ${p.pass}`);
      });
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 