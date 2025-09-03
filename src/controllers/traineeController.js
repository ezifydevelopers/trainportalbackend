const prisma = require('../prismaClient');

module.exports = {
  dashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      const progressRecords = await prisma.traineeProgress.findMany({
        where: { userId },
        include: {
          module: {
            include: {
              videos: true,
            },
          },
        },
        orderBy: { module: { order: 'asc' } },
      });

      console.log('=== DASHBOARD DEBUG ===');
      console.log('User ID:', userId);
      console.log('Total progress records:', progressRecords.length);
      progressRecords.forEach((record, index) => {
        console.log(`Progress record ${index + 1}:`, {
          moduleId: record.moduleId,
          moduleName: record.module.name,
          completed: record.completed,
          pass: record.pass,
          score: record.score
        });
      });

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
            videoDuration: progressRecords[i].module.videos?.[0]?.duration || 0
          };
          break;
        }
      }

      // Create module progress array with unlock status
      const moduleProgress = progressRecords.map((p, index) => {
        const isUnlocked = index === 0 || 
          (index > 0 && progressRecords[index - 1].completed && progressRecords[index - 1].pass);

        console.log(`Module ${index + 1} (${p.module.name}):`, {
          id: p.module.id,
          completed: p.completed,
          pass: p.pass,
          unlocked: isUnlocked,
          previousModuleCompleted: index > 0 ? progressRecords[index - 1].completed : 'N/A',
          previousModulePass: index > 0 ? progressRecords[index - 1].pass : 'N/A'
        });

        return {
          moduleId: p.module.id,
          moduleName: p.module.name,
          timeSpentOnVideo: p.timeSpent || 0,
          marksObtained: p.score || 0,
          pass: p.pass,
          completed: p.completed,
          videoDuration: p.module.videos?.[0]?.duration || 0,
          unlocked: isUnlocked
        };
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company
        },
        overallProgress: Math.round((completedModules / totalModules) * 100),
        modulesCompleted: completedModules,
        averageScore: Math.round(averageScore),
        totalTimeSpent: totalTime,
        totalModules,
        currentModule,
        moduleProgress,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Error in dashboard:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  listModules: async (req, res) => {
    try {
      const userId = req.user.id;
      const progressRecords = await prisma.traineeProgress.findMany({
        where: { userId },
        include: {
          module: {
            include: {
              videos: true,
            },
          },
        },
        orderBy: { module: { order: 'asc' } },
      });

      const modules = progressRecords.map((p, index) => {
        // First module is always unlocked
        // Subsequent modules are unlocked if the previous module is completed and passed
        const isUnlocked = index === 0 || 
          (index > 0 && progressRecords[index - 1].completed && progressRecords[index - 1].pass);

        return {
          moduleId: p.module.id,
          moduleName: p.module.name,
          videoDuration: p.module.videos?.[0]?.duration || 0,
          completed: p.completed,
          marksObtained: p.score || 0,
          pass: p.pass,
          timeSpentOnVideo: p.timeSpent || 0,
          unlocked: isUnlocked
        };
      });

      res.json(modules);
    } catch (err) {
      console.error('Error in listModules:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getModule: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const progress = await prisma.traineeProgress.findFirst({
        where: {
          userId: userId,
          moduleId: Number(id)
        },
        include: {
          module: {
            include: {
              videos: true,
              mcqs: true
            }
          }
        }
      });

      if (!progress) {
        return res.status(404).json({ message: 'Module not found' });
      }

      res.json(progress.module);
    } catch (err) {
      console.error('Error in getModule:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  completeModule: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log('=== COMPLETE MODULE DEBUG ===');
      console.log('Module ID:', id);
      console.log('User ID:', userId);

      // Get the module to check if it has MCQs
      const module = await prisma.trainingModule.findUnique({
        where: { id: Number(id) },
        include: {
          mcqs: true
        }
      });

      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      console.log('Module MCQs count:', module.mcqs?.length || 0);

      // If module has no MCQs, mark as completed and passed
      // If module has MCQs, don't mark as completed (user needs to take quiz)
      const hasMCQs = module.mcqs && module.mcqs.length > 0;
      
      if (hasMCQs) {
        // Module has MCQs - don't mark as completed, user needs to take quiz
        res.json({ 
          message: 'Module video completed. Please take the quiz to proceed.',
          hasMCQs: true,
          autoPassed: false
        });
        return;
      }
      
      // Module has no MCQs - mark as completed and auto-pass
      const updateData = {
        completed: true,
        pass: true, 
        score: 100
      };

      console.log('Update data:', updateData);

      // Mark the module as completed for this user
      const progress = await prisma.traineeProgress.updateMany({
        where: { userId, moduleId: Number(id) },
        data: updateData,
      });

      res.json({ 
        message: 'Module completed successfully! You can now access the next module.',
        hasMCQs: false,
        autoPassed: true
      });
    } catch (err) {
      console.error('Error in completeModule:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  submitMCQ: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { answers } = req.body;

      console.log('=== SUBMIT MCQ DEBUG ===');
      console.log('Module ID:', id);
      console.log('User ID:', userId);
      console.log('Answers:', answers);

      // Get all MCQs for this module
      const mcqs = await prisma.mCQ.findMany({ where: { moduleId: Number(id) } });
      
      if (mcqs.length === 0) {
        return res.status(400).json({ message: 'No MCQs found for this module' });
      }

      console.log('Found MCQs:', mcqs.length);

      // Calculate correct answers
      let correctAnswers = 0;
      const answerRecords = [];

      for (const mcq of mcqs) {
        const userAnswer = answers[mcq.id];
        console.log(`MCQ ${mcq.id}: User answer = "${userAnswer}", Correct answer = "${mcq.answer}"`);
        
        // Handle undefined or null answers
        if (!userAnswer || userAnswer === undefined || userAnswer === null) {
          console.log(`MCQ ${mcq.id}: No answer provided, marking as incorrect`);
          answerRecords.push({
            userId,
            moduleId: Number(id),
            mcqId: mcq.id,
            selectedOption: '', // Use empty string instead of undefined
            isCorrect: false
          });
          continue;
        }

        const isCorrect = userAnswer === mcq.answer;
        console.log(`MCQ ${mcq.id}: isCorrect = ${isCorrect}`);
        
        if (isCorrect) correctAnswers++;

        answerRecords.push({
          userId,
          moduleId: Number(id),
          mcqId: mcq.id,
          selectedOption: userAnswer,
          isCorrect
        });
      }

      console.log('Answer records to save:', answerRecords);
      console.log('Correct answers:', correctAnswers, 'out of', mcqs.length);

      // Save all answers
      await prisma.mCQAnswer.createMany({
        data: answerRecords
      });

      // Calculate score as percentage and pass/fail (pass if score >= 70%)
      const scorePercentage = Math.round((correctAnswers / mcqs.length) * 100);
      const pass = scorePercentage >= 70;

      console.log('Final score:', scorePercentage, '%, Pass:', pass);

      const updated = await prisma.traineeProgress.updateMany({
        where: { userId, moduleId: Number(id) },
        data: { 
          completed: true, 
          score: scorePercentage, 
          pass 
        },
      });

      res.json({ 
        score: scorePercentage, 
        pass, 
        totalQuestions: mcqs.length,
        correctAnswers 
      });
    } catch (err) {
      console.error('=== SUBMIT MCQ ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },

  updateTimeSpent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { timeSpent } = req.body;

      const updated = await prisma.traineeProgress.updateMany({
        where: { userId, moduleId: Number(id) },
        data: { timeSpent: Number(timeSpent) },
      });

      res.json({ message: 'Time spent updated' });
    } catch (err) {
      console.error('Error in updateTimeSpent:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  requestHelp: async (req, res) => {
    try {
      const userId = req.user.id;
      const { moduleId, message } = req.body;
      
      const helpRequest = await prisma.helpRequest.create({
        data: {
          traineeId: userId,
          moduleId: moduleId ? Number(moduleId) : null,
          message: message || null,
          status: 'PENDING'
        },
        include: {
          trainee: { select: { id: true, name: true, email: true, company: true } },
          module: { select: { id: true, name: true } }
        }
      });
      
      res.status(201).json({ 
        message: 'Help request submitted successfully',
        helpRequest: {
          id: helpRequest.id,
          status: helpRequest.status,
          createdAt: helpRequest.createdAt
        }
      });
    } catch (err) {
      console.error('Error in requestHelp:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  submitFeedback: async (req, res) => {
    try {
      const userId = req.user.id;
      const { moduleId, rating, comment } = req.body;
      
      // Validate rating (1-5 stars)
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Check if module exists and trainee has access to it
      const progress = await prisma.traineeProgress.findFirst({
        where: {
          userId: userId,
          moduleId: Number(moduleId)
        },
        include: {
          module: true
        }
      });

      if (!progress) {
        return res.status(404).json({ message: 'Module not found or access denied' });
      }

      // Check if feedback already exists for this module and trainee
      const existingFeedback = await prisma.feedback.findFirst({
        where: {
          traineeId: userId,
          moduleId: Number(moduleId)
        }
      });

      if (existingFeedback) {
        return res.status(400).json({ message: 'Feedback already submitted for this module' });
      }

      // Create feedback
      const feedback = await prisma.feedback.create({
        data: {
          traineeId: userId,
          moduleId: Number(moduleId),
          rating: Number(rating),
          comment: comment || null
        },
        include: {
          trainee: { select: { id: true, name: true, email: true } },
          module: { select: { id: true, name: true } }
        }
      });
      
      res.status(201).json({ 
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback.id,
          rating: feedback.rating,
          comment: feedback.comment,
          createdAt: feedback.createdAt
        }
      });
    } catch (err) {
      console.error('Error in submitFeedback:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFeedback: async (req, res) => {
    try {
      const userId = req.user.id;
      const { moduleId } = req.params;
      
      const feedback = await prisma.feedback.findFirst({
        where: {
          traineeId: userId,
          moduleId: Number(moduleId)
        },
        include: {
          module: { select: { id: true, name: true } }
        }
      });

      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      res.json(feedback);
    } catch (err) {
      console.error('Error in getFeedback:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },
}; 