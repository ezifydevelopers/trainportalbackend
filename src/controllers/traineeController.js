const prisma = require('../prismaClient');
const CertificateService = require('../services/certificateService');

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

      progressRecords.forEach((record, index) => {

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
        // Always unlock resource modules, otherwise use sequential logic
        const isUnlocked = progressRecords[i].module.isResourceModule || 
          (i === 0 || (i > 0 && progressRecords[i - 1].completed && progressRecords[i - 1].pass));
        
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
        // Always unlock resource modules, otherwise use sequential logic
        const isUnlocked = p.module.isResourceModule || 
          (index === 0 || (index > 0 && progressRecords[index - 1].completed && progressRecords[index - 1].pass));

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
          unlocked: isUnlocked,
          isResourceModule: p.module.isResourceModule || false
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

      res.status(500).json({ message: 'Server error' });
    }
  },

  completeModule: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

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

      // Mark the module as completed for this user
      const progress = await prisma.traineeProgress.updateMany({
        where: { userId, moduleId: Number(id) },
        data: updateData,
      });

      // Check if user has completed all modules and generate certificate
      await checkAndGenerateCertificate(userId, module.companyId);

      res.json({ 
        message: 'Module completed successfully! You can now access the next module.',
        hasMCQs: false,
        autoPassed: true
      });
    } catch (err) {

      res.status(500).json({ message: 'Server error' });
    }
  },

  submitMCQ: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { answers } = req.body;

      // Get the module and all MCQs for this module
      const module = await prisma.trainingModule.findUnique({
        where: { id: Number(id) }
      });
      
      const mcqs = await prisma.mCQ.findMany({ where: { moduleId: Number(id) } });
      
      if (mcqs.length === 0) {
        return res.status(400).json({ message: 'No MCQs found for this module' });
      }

      // Calculate correct answers
      let correctAnswers = 0;
      const answerRecords = [];

      for (const mcq of mcqs) {
        const userAnswer = answers[mcq.id];

        // Handle undefined or null answers
        if (!userAnswer || userAnswer === undefined || userAnswer === null) {

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

        if (isCorrect) correctAnswers++;

        answerRecords.push({
          userId,
          moduleId: Number(id),
          mcqId: mcq.id,
          selectedOption: userAnswer,
          isCorrect
        });
      }

      // Save all answers
      await prisma.mCQAnswer.createMany({
        data: answerRecords
      });

      // Calculate score as percentage and pass/fail (pass if score >= 70%)
      const scorePercentage = Math.round((correctAnswers / mcqs.length) * 100);
      const pass = scorePercentage >= 70;

      const updated = await prisma.traineeProgress.updateMany({
        where: { userId, moduleId: Number(id) },
        data: { 
          completed: true, 
          score: scorePercentage, 
          pass 
        },
      });

      // Check if user has completed all modules and generate certificate
      if (pass) {
        await checkAndGenerateCertificate(userId, module.companyId);
      }

      res.json({ 
        score: scorePercentage, 
        pass, 
        totalQuestions: mcqs.length,
        correctAnswers 
      });
    } catch (err) {

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

      res.status(500).json({ message: 'Server error' });
    }
  },

  // Resource time tracking methods
  updateResourceTimeTracking: async (req, res) => {
    try {
      const { resourceId, timeSpent } = req.body;
      const userId = req.user.id;

      if (!resourceId || timeSpent === undefined) {
        return res.status(400).json({ success: false, message: 'Resource ID and time spent are required' });
      }

      // Upsert resource time tracking
      const timeTracking = await prisma.resourceTimeTracking.upsert({
        where: {
          resourceId_userId: {
            resourceId: parseInt(resourceId),
            userId: userId
          }
        },
        update: {
          timeSpent: parseInt(timeSpent),
          lastUpdated: new Date()
        },
        create: {
          resourceId: parseInt(resourceId),
          userId: userId,
          timeSpent: parseInt(timeSpent)
        }
      });

      return res.json({ success: true, timeTracking });
    } catch (error) {

      return res.status(500).json({ success: false, message: 'Failed to update time tracking', error: error.message });
    }
  },

  getResourceTimeTracking: async (req, res) => {
    try {
      const { resourceId } = req.params;
      const userId = req.user.id;

      const timeTracking = await prisma.resourceTimeTracking.findUnique({
        where: {
          resourceId_userId: {
            resourceId: parseInt(resourceId),
            userId: userId
          }
        }
      });

      return res.json({ success: true, timeTracking });
    } catch (error) {

      return res.status(500).json({ success: false, message: 'Failed to get time tracking', error: error.message });
    }
  },

  // Certificate endpoints for trainees
  getMyCertificates: async (req, res) => {
    try {
      const userId = req.user.id;
      const certificates = await CertificateService.getCertificateByUser(userId);

      res.json({
        success: true,
        certificates: certificates
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificates',
        error: error.message
      });
    }
  },

  downloadMyCertificate: async (req, res) => {
    try {
      const userId = req.user.id;
      const { certificateId } = req.params;

      if (!certificateId) {
        return res.status(400).json({
          success: false,
          message: 'Certificate ID is required'
        });
      }

      const certificate = await CertificateService.getCertificateById(parseInt(certificateId));

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      // Verify the certificate belongs to the requesting user
      if (certificate.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Certificate does not belong to you'
        });
      }

      if (!certificate.pdfPath) {
        return res.status(404).json({
          success: false,
          message: 'Certificate PDF not found'
        });
      }

      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(__dirname, '../../', certificate.pdfPath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Certificate file not found on server'
        });
      }

      res.download(filePath, `certificate-${certificate.certificateNumber}.pdf`);
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to download certificate',
        error: error.message
      });
    }
  },

  generateMyCertificate: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      if (!user || !user.companyId) {
        return res.status(400).json({
          success: false,
          message: 'User not found or not assigned to a company'
        });
      }

      const certificate = await CertificateService.generateCertificate(userId, user.companyId);

      res.json({
        success: true,
        certificate: certificate,
        message: 'Certificate generated successfully'
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate',
        error: error.message
      });
    }
  }
};

// Helper function to check if user has completed all modules and generate certificate
async function checkAndGenerateCertificate(userId, companyId) {
  try {
    // Check if user has completed all modules for this company
    const completedModules = await prisma.traineeProgress.findMany({
      where: {
        userId: userId,
        isCompleted: true
      },
      include: {
        module: {
          where: { companyId: companyId }
        }
      }
    });

    const totalModules = await prisma.trainingModule.count({
      where: { companyId: companyId }
    });

    // If user has completed all modules, generate certificate
    if (completedModules.length >= totalModules) {

      try {
        await CertificateService.generateCertificate(userId, companyId);

      } catch (certError) {

        // Don't throw error - certificate generation failure shouldn't break module completion
      }
    }
  } catch (error) {

    // Don't throw error - certificate check failure shouldn't break module completion
  }
} 