const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTraineesToModules() {
  try {
    console.log('Starting trainee assignment to modules...');

    // Get all trainees
    const trainees = await prisma.user.findMany({
      where: { role: 'TRAINEE' },
      include: { company: true }
    });

    console.log(`Found ${trainees.length} trainees`);

    for (const trainee of trainees) {
      if (!trainee.companyId) {
        console.log(`Skipping trainee ${trainee.name} (${trainee.email}) - no company assigned`);
        continue;
      }

      // Get all modules for this trainee's company
      const companyModules = await prisma.trainingModule.findMany({
        where: { companyId: trainee.companyId }
      });

      if (companyModules.length === 0) {
        console.log(`No modules found for company: ${trainee.company.name}`);
        continue;
      }

      // Check existing progress records
      const existingProgress = await prisma.traineeProgress.findMany({
        where: { userId: trainee.id }
      });

      const existingModuleIds = existingProgress.map(p => p.moduleId);
      const modulesToAssign = companyModules.filter(m => !existingModuleIds.includes(m.id));

      if (modulesToAssign.length === 0) {
        console.log(`Trainee ${trainee.name} already assigned to all company modules`);
        continue;
      }

      // Create progress records for unassigned modules
      const progressRecords = modulesToAssign.map(module => ({
        userId: trainee.id,
        moduleId: module.id,
        completed: false,
        score: null,
        timeSpent: null,
        pass: false,
      }));

      await prisma.traineeProgress.createMany({
        data: progressRecords,
      });

      console.log(`Assigned trainee ${trainee.name} to ${modulesToAssign.length} modules in ${trainee.company.name}`);
    }

    console.log('Trainee assignment completed successfully!');
  } catch (error) {
    console.error('Error assigning trainees to modules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
assignTraineesToModules(); 