const prisma = require('../prismaClient');

class ModuleCompletionService {
  constructor() {
    this.checkInterval = null;
    this.startMonitoring();
  }

  startMonitoring() {
    // Check for module completions every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkModuleCompletions();
    }, 30000);
  }

  async checkModuleCompletions() {
    try {
      // Get all trainees
      const trainees = await prisma.user.findMany({
        where: {
          role: 'TRAINEE'
        },
        include: {
          company: true,
          progress: {
            include: {
              module: true
            }
          }
        }
      });
      
      for (const trainee of trainees) {
        await this.checkTraineeCompletion(trainee);
      }
    } catch (error) {
      console.error('Error checking module completions:', error);
    }
  }

  async checkTraineeCompletion(trainee) {
    try {
      // Get all available modules
      const totalModules = await prisma.trainingModule.count();

      // Get completed modules for this trainee
      const completedModules = trainee.progress.filter(
        progress => progress.status === 'COMPLETED'
      ).length;

      // Check if trainee has completed all modules
      if (completedModules === totalModules && totalModules > 0) {
        // Check if we've already notified about this completion
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: trainee.id,
            type: 'MODULE_COMPLETION',
            isRead: false
          }
        });

        if (!existingNotification) {
          // Create notification record
          await prisma.notification.create({
            data: {
              userId: trainee.id,
              type: 'MODULE_COMPLETION',
              title: 'All Modules Completed!',
              message: `${trainee.name} has completed all training modules`,
              isRead: false,
              metadata: {
                traineeId: trainee.id,
                traineeName: trainee.name,
                companyName: trainee.company?.name || 'Unknown Company',
                completedAt: new Date().toISOString()
              }
            }
          });

          // Send WebSocket notification to all users
          if (global.wsHandler) {
            global.wsHandler.broadcastToAll({
              type: 'MODULE_COMPLETION',
              data: {
                traineeId: trainee.id,
                traineeName: trainee.name,
                companyName: trainee.company?.name || 'Unknown Company',
                completedAt: new Date().toISOString(),
                totalModules: totalModules
              }
            });
          }

          console.log(`🎉 Trainee ${trainee.name} has completed all ${totalModules} modules!`);
        }
      }
    } catch (error) {
      console.error(`Error checking completion for trainee ${trainee.id}:`, error);
    }
  }

  // Manual check for a specific trainee (can be called from API)
  async checkTraineeCompletionById(traineeId) {
    try {
      const trainee = await prisma.user.findUnique({
        where: { id: traineeId },
        include: {
          company: true,
          progress: {
            include: {
              module: true
            }
          }
        }
      });

      if (trainee && trainee.role === 'TRAINEE') {
        await this.checkTraineeCompletion(trainee);
      }
    } catch (error) {
      console.error(`Error checking completion for trainee ${traineeId}:`, error);
    }
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

module.exports = ModuleCompletionService;
