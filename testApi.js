const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testApi() {
  try {
    // Get the first trainee
    const trainee = await prisma.user.findFirst({
      where: { role: 'TRAINEE' }
    });

    if (!trainee) {
      console.log('No trainee found');
      return;
    }

    console.log(`Testing API for trainee: ${trainee.name} (ID: ${trainee.id})`);

    // Create a JWT token for the trainee
    const token = jwt.sign(
      { id: trainee.id, email: trainee.email, role: trainee.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log(`Generated token: ${token.substring(0, 50)}...`);

    // Test the dashboard endpoint
    const progressRecords = await prisma.traineeProgress.findMany({
      where: { userId: trainee.id },
      include: {
        module: {
          include: {
            video: true,
          },
        },
      },
      orderBy: { moduleId: 'asc' },
    });

    console.log(`\nProgress records found: ${progressRecords.length}`);

    const totalModules = progressRecords.length;
    const completedModules = progressRecords.filter(p => p.pass).length;
    const averageScore = totalModules > 0 
      ? progressRecords.reduce((sum, p) => sum + (p.score || 0), 0) / totalModules 
      : 0;
    const totalTime = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Find current module (first incomplete module that is unlocked)
    let currentModule = null;
    for (let i = 0; i < progressRecords.length; i++) {
      const isUnlocked = i === 0 || 
        (i > 0 && progressRecords[i - 1].completed && progressRecords[i - 1].pass);
      
      if (isUnlocked && !progressRecords[i].completed) {
        currentModule = {
          moduleId: progressRecords[i].module.id,
          moduleName: progressRecords[i].module.name,
          videoDuration: progressRecords[i].module.video?.duration || 0
        };
        break;
      }
    }

    // Create module progress array with unlock status
    const moduleProgress = progressRecords.map((p, index) => {
      const isUnlocked = index === 0 || 
        (index > 0 && progressRecords[index - 1].completed && progressRecords[index - 1].pass);

      return {
        moduleId: p.module.id,
        moduleName: p.module.name,
        timeSpentOnVideo: p.timeSpent || 0,
        marksObtained: p.score || 0,
        pass: p.pass,
        completed: p.completed,
        videoDuration: p.module.video?.duration || 0,
        unlocked: isUnlocked
      };
    });

    const dashboardData = {
      user: {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        company: trainee.company
      },
      overallProgress: Math.round((completedModules / totalModules) * 100),
      modulesCompleted: completedModules,
      averageScore: Math.round(averageScore),
      totalTimeSpent: totalTime,
      totalModules,
      currentModule,
      moduleProgress,
      lastUpdated: new Date()
    };

    console.log('\nDashboard API Response:');
    console.log(JSON.stringify(dashboardData, null, 2));

  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApi(); 