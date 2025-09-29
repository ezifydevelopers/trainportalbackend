const prisma = require('../prismaClient');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const NotificationService = require('../services/notificationService');
const CertificateService = require('../services/certificateService');

module.exports = {
  // Simple test endpoint
  testEndpoint: async (req, res) => {
    try {
      res.json({ message: 'Admin API is working', timestamp: new Date() });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  getTrainees: async (req, res) => {
    try {
      console.log('Fetching trainees...');
      
      // Test database connection first
      await prisma.$connect();
      console.log('Database connected successfully');
      
      // First, check if we can connect to the database
      const trainees = await prisma.user.findMany({
        where: { role: 'TRAINEE' },
        include: { 
          company: true,
          progress: {
            include: {
              module: {
                include: {
                  videos: true
                }
              }
            },
            orderBy: { moduleId: 'asc' }
          }
        },
      });
      
      console.log(`Found ${trainees.length} trainees`);
      // Calculate progress for each trainee
      const traineesWithProgress = trainees.map(trainee => {
        try {
          const progressRecords = trainee.progress || [];
          const totalModules = progressRecords.length;
          if (totalModules === 0) {
            return {
              ...trainee,
              progress: [],
              calculatedProgress: {
                overallProgress: 0,
                modulesCompleted: 0,
                averageScore: 0,
                totalTimeSpent: 0,
                totalModules: 0,
                lastUpdated: new Date()
              }
            };
          }

          const completedModules = progressRecords.filter(p => p.pass).length;
          const modulesWithScores = progressRecords.filter(p => p.score !== null);
          // Calculate average score across ALL modules (including those without scores as 0)
          const averageScore = totalModules > 0 
            ? progressRecords.reduce((sum, p) => sum + (p.score || 0), 0) / totalModules 
            : 0;
          const totalTime = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
          
          // Calculate overall progress: each module is worth equal percentage
          const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
          return {
            ...trainee,
            progress: progressRecords, // Keep original progress array
            calculatedProgress: {
              overallProgress: Math.round(overallProgress),
              modulesCompleted: completedModules,
              averageScore: Math.round(averageScore),
              totalTimeSpent: totalTime,
              totalModules,
              lastUpdated: new Date()
            }
          };
        } catch (traineeError) {
          return {
            ...trainee,
            progress: [],
            calculatedProgress: {
              overallProgress: 0,
              modulesCompleted: 0,
              averageScore: 0,
              totalTimeSpent: 0,
              totalModules: 0,
              lastUpdated: new Date()
            }
          };
        }
      });
      res.json(traineesWithProgress);
    } catch (err) {
      console.error('Error in getTrainees:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        message: 'Server error', 
        details: err.message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  },
  createTrainee: async (req, res) => {
    try {
      const { name, email, password, companyId } = req.body;
      if (!name || !email || !password || !companyId) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      const company = await prisma.company.findUnique({ where: { id: Number(companyId) } });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'TRAINEE',
          companyId: Number(companyId),
          isVerified: true,
        },
      });

      // Automatically assign trainee to all modules in their company
      const companyModules = await prisma.trainingModule.findMany({
        where: { companyId: Number(companyId) },
      });

      if (companyModules.length > 0) {
        const progressRecords = companyModules.map(module => ({
          userId: user.id,
          moduleId: module.id,
          completed: false,
          score: null,
          timeSpent: null,
          pass: false,
        }));

        await prisma.traineeProgress.createMany({
          data: progressRecords,
        });
      }

      res.status(201).json({ 
        message: 'Trainee created and assigned to modules', 
        user: { id: user.id, name: user.name, email: user.email },
        modulesAssigned: companyModules.length
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  updateTrainee: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, companyId, status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Trainee ID is required'
        });
      }

      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user || user.role !== 'TRAINEE') {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      let updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) updateData.password = await bcrypt.hash(password, 10);
      if (companyId !== undefined) {
        const company = await prisma.company.findUnique({ where: { id: Number(companyId) } });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        updateData.companyId = Number(companyId);
      }
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'APPROVED') updateData.isVerified = true;
      }

      const updatedTrainee = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // If approved and assigned to a company, create progress records for all company modules
      if (status === 'APPROVED' && companyId) {
        const companyModules = await prisma.trainingModule.findMany({
          where: { companyId: parseInt(companyId) }
        });

        if (companyModules.length > 0) {
          const progressRecords = companyModules.map(module => ({
            userId: parseInt(id),
            moduleId: module.id,
            completed: false,
            score: null,
            timeSpent: 0,
            pass: false,
          }));

          await prisma.traineeProgress.createMany({
            data: progressRecords,
            skipDuplicates: true
          });
        }
      }

      res.json({
        success: true,
        message: 'Trainee updated successfully',
        user: updatedTrainee
      });
    } catch (err) {
      console.error('Error updating trainee:', err);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: err.message 
      });
    }
  },
  deleteTrainee: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'TRAINEE') {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      // Delete all related records first to avoid foreign key constraint violations
      await prisma.$transaction(async (tx) => {
        try {
          // Delete MCQ answers for this user
          await tx.mCQAnswer.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting MCQ answers:', error.message);
        }

        try {
          // Delete trainee progress records for this user
          await tx.traineeProgress.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting trainee progress:', error.message);
        }

        try {
          // Delete help requests for this user
          await tx.helpRequest.deleteMany({
            where: { traineeId: userId }
          });
        } catch (error) {
          console.log('Error deleting help requests:', error.message);
        }

        try {
          // Delete feedback from this user
          await tx.feedback.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting feedback:', error.message);
        }

        try {
          // Delete notifications for this user
          await tx.notification.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting notifications:', error.message);
        }

        try {
          // Delete chat room participants for this user
          await tx.chatRoomParticipant.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting chat room participants:', error.message);
        }

        try {
          // Delete sent messages
          await tx.chatMessage.deleteMany({
            where: { senderId: userId }
          });
        } catch (error) {
          console.log('Error deleting sent messages:', error.message);
        }

        try {
          // Delete received messages
          await tx.chatMessage.deleteMany({
            where: { receiverId: userId }
          });
        } catch (error) {
          console.log('Error deleting received messages:', error.message);
        }

        try {
          // Delete resource time tracking for this user
          await tx.resourceTimeTracking.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting resource time tracking:', error.message);
        }

        try {
          // Delete certificates for this user
          await tx.certificate.deleteMany({
            where: { userId: userId }
          });
        } catch (error) {
          console.log('Error deleting certificates:', error.message);
        }

        try {
          // Finally delete the user
          await tx.user.delete({ where: { id: userId } });
        } catch (error) {
          console.log('Error deleting user:', error.message);
          throw error;
        }
      });

      res.json({ message: 'Trainee deleted successfully' });
    } catch (err) {
      console.error('Error in deleteTrainee:', err);
      res.status(500).json({ 
        message: 'Server error', 
        details: err.message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  },
  getCompanies: async (req, res) => {
    try {
      const companies = await prisma.company.findMany();
      res.json({ success: true, companies });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  },
  createCompany: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: 'Name is required' });
      const existing = await prisma.company.findUnique({ where: { name } });
      if (existing) return res.status(409).json({ message: 'Company already exists' });
      let logo = null;
      if (req.file) logo = req.file.filename;
      const company = await prisma.company.create({ data: { name, logo } });
      res.status(201).json(company);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  updateCompany: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      let data = {};
      if (name) data.name = name;
      if (req.file) data.logo = req.file.filename;
      const company = await prisma.company.update({ where: { id: Number(id) }, data });
      res.json(company);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  deleteCompany: async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = Number(id);
      
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          users: {
            where: { role: 'TRAINEE' }
          },
          modules: {
            include: {
              videos: true,
              mcqs: true,
              progress: true,
              mcqAnswers: true
            }
          }
        }
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      // Delete all related data in a transaction
      await prisma.$transaction(async (tx) => {
        try {
          // First, delete all notifications for users in this company
          const deletedNotifications = await tx.notification.deleteMany({
            where: {
              user: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all feedback for users in this company
          const deletedFeedback = await tx.feedback.deleteMany({
            where: {
              user: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all help requests for users in this company
          const deletedHelpRequests = await tx.helpRequest.deleteMany({
            where: {
              trainee: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all chat messages for chat rooms in this company
          const deletedChatMessages = await tx.chatMessage.deleteMany({
            where: {
              chatRoom: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all chat room participants for chat rooms in this company
          const deletedChatParticipants = await tx.chatRoomParticipant.deleteMany({
            where: {
              chatRoom: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all chat rooms for this company
          const deletedChatRooms = await tx.chatRoom.deleteMany({
            where: {
              companyId: companyId
            }
          });
        } catch (error) {
        }

        try {
          // Delete MCQ answers for all modules in this company
          const deletedMcqAnswers = await tx.mCQAnswer.deleteMany({
            where: {
              module: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete trainee progress for all modules in this company
          const deletedProgress = await tx.traineeProgress.deleteMany({
            where: {
              module: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete MCQ answers for all trainees in this company
          const deletedTraineeMcqAnswers = await tx.mCQAnswer.deleteMany({
            where: {
              user: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete trainee progress for all trainees in this company
          const deletedTraineeProgress = await tx.traineeProgress.deleteMany({
            where: {
              user: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all MCQs for all modules in this company
          const deletedMcqs = await tx.mCQ.deleteMany({
            where: {
              module: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all videos for all modules in this company
          const deletedVideos = await tx.video.deleteMany({
            where: {
              module: {
                companyId: companyId
              }
            }
          });
        } catch (error) {
        }

        try {
          // Delete all modules in this company
          const deletedModules = await tx.trainingModule.deleteMany({
            where: {
              companyId: companyId
            }
          });
        } catch (error) {
        }

        try {
          // Delete all trainees in this company
          const deletedTrainees = await tx.user.deleteMany({
            where: {
              companyId: companyId
            }
          });
        } catch (error) {
        }

        try {
          // Finally delete the company
          await tx.company.delete({
            where: { id: companyId }
          });
        } catch (error) {
          throw new Error(`Failed to delete company: ${error.message}`);
        }
      });

      res.json({ message: 'Company and all related data deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  addModule: async (req, res) => {
    try {
      const { id } = req.params; 
      const { name, isResourceModule } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Module name is required' });
      }
      
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: Number(id) },
        include: {
          users: {
            where: { role: 'TRAINEE' }
          }
        }
      });
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      // Get the next order number for this company
      const lastModule = await prisma.trainingModule.findFirst({
        where: { companyId: Number(id) },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      
      const nextOrder = (lastModule?.order || 0) + 1;
      
      const module = await prisma.trainingModule.create({
        data: {
          name,
          companyId: Number(id),
          isResourceModule: Boolean(isResourceModule),
          order: nextOrder,
        },
      });
      // Automatically assign all trainees in this company to the new module
      if (company.users.length > 0) {
        const progressRecords = company.users.map(user => ({
          userId: user.id,
          moduleId: module.id,
          completed: false,
          score: null,
          timeSpent: null,
          pass: false,
        }));

        await prisma.traineeProgress.createMany({
          data: progressRecords,
        });
      }
      res.status(201).json({
        message: 'Module created and assigned to trainees',
        module,
        traineesAssigned: company.users.length
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },

  // Atomic module creation with video and MCQs
  createModuleWithContent: async (req, res) => {
    const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize progress tracking
    if (!global.moduleCreationProgress) {
      global.moduleCreationProgress = {};
    }
    
    global.moduleCreationProgress[sessionId] = {
      status: 'starting',
      progress: 0,
      message: 'Initializing module creation...',
      data: null,
      error: null
    };

    try {
      const { companyId, name, isResourceModule, duration, mcqs } = req.body;
      
      // Update progress
      global.moduleCreationProgress[sessionId] = {
        status: 'validating',
        progress: 10,
        message: 'Validating input data...',
        data: null,
        error: null
      };

      // Validation
      if (!companyId || !name) {
        global.moduleCreationProgress[sessionId] = {
          status: 'error',
          progress: 0,
          message: 'Validation failed',
          data: null,
          error: 'Company ID and module name are required'
        };
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID and module name are required' 
        });
      }

      if (!req.file) {
        global.moduleCreationProgress[sessionId] = {
          status: 'error',
          progress: 0,
          message: 'Validation failed',
          data: null,
          error: 'Video file is required'
        };
        return res.status(400).json({ 
          success: false, 
          message: 'Video file is required' 
        });
      }

      if (!duration) {
        global.moduleCreationProgress[sessionId] = {
          status: 'error',
          progress: 0,
          message: 'Validation failed',
          data: null,
          error: 'Video duration is required'
        };
        return res.status(400).json({ 
          success: false, 
          message: 'Video duration is required' 
        });
      }

      // Validate duration
      let videoDuration = Number(duration);
      if (isNaN(videoDuration) || !isFinite(videoDuration) || videoDuration <= 0) {
        global.moduleCreationProgress[sessionId] = {
          status: 'error',
          progress: 0,
          message: 'Validation failed',
          data: null,
          error: 'Invalid video duration'
        };
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid video duration. Please provide a valid positive number.' 
        });
      }

      // Update progress
      global.moduleCreationProgress[sessionId] = {
        status: 'validating',
        progress: 20,
        message: 'Validating MCQs...',
        data: null,
        error: null
      };

      // Validate MCQs if provided
      let mcqData = [];
      if (mcqs && Array.isArray(mcqs)) {
        mcqData = mcqs.map(mcq => {
          if (!mcq.question || !mcq.options || !Array.isArray(mcq.options) || !mcq.answer) {
            throw new Error('Invalid MCQ data: question, options, and answer are required');
          }
          return {
            question: String(mcq.question),
            options: mcq.options.map(opt => String(opt)),
            answer: String(mcq.answer),
            explanation: mcq.explanation ? String(mcq.explanation) : null
          };
        });
      }

      // Update progress
      global.moduleCreationProgress[sessionId] = {
        status: 'validating',
        progress: 30,
        message: 'Checking company...',
        data: null,
        error: null
      };

      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: Number(companyId) },
        include: {
          users: {
            where: { role: 'TRAINEE' }
          }
        }
      });
      
      if (!company) {
        global.moduleCreationProgress[sessionId] = {
          status: 'error',
          progress: 0,
          message: 'Company not found',
          data: null,
          error: 'Company not found'
        };
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found' 
        });
      }

      // Update progress
      global.moduleCreationProgress[sessionId] = {
        status: 'creating',
        progress: 40,
        message: 'Creating module...',
        data: null,
        error: null
      };

      // Create everything in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create module with proper order
        // Get the next order number for this company
        const lastModule = await tx.trainingModule.findFirst({
          where: { companyId: Number(companyId) },
          orderBy: { order: 'desc' },
          select: { order: true }
        });
        
        const nextOrder = (lastModule?.order || 0) + 1;
        
        const module = await tx.trainingModule.create({
          data: {
            name: String(name),
            companyId: Number(companyId),
            isResourceModule: Boolean(isResourceModule),
            order: nextOrder,
          },
        });

        // Update progress
        global.moduleCreationProgress[sessionId] = {
          status: 'creating',
          progress: 60,
          message: 'Creating video...',
          data: null,
          error: null
        };

        // 2. Create video
        const video = await tx.video.create({
          data: {
            url: `/uploads/${req.file.filename}`,
            duration: videoDuration,
            moduleId: module.id,
          },
        });

        // Update progress
        global.moduleCreationProgress[sessionId] = {
          status: 'creating',
          progress: 80,
          message: 'Creating MCQs...',
          data: null,
          error: null
        };

        // 3. Create MCQs if provided
        let createdMCQs = [];
        if (mcqData.length > 0) {
          const mcqDataWithModuleId = mcqData.map(mcq => ({
            ...mcq,
            moduleId: module.id
          }));

          await tx.mCQ.createMany({
            data: mcqDataWithModuleId
          });

          // Fetch created MCQs
          createdMCQs = await tx.mCQ.findMany({
            where: { moduleId: module.id }
          });
        }

        // Update progress
        global.moduleCreationProgress[sessionId] = {
          status: 'creating',
          progress: 90,
          message: 'Assigning to trainees...',
          data: null,
          error: null
        };

        // 4. Assign module to all trainees in the company
        if (company.users.length > 0) {
          const progressRecords = company.users.map(user => ({
            userId: user.id,
            moduleId: module.id,
            completed: false,
            score: null,
            timeSpent: null,
            pass: false,
          }));

          await tx.traineeProgress.createMany({
            data: progressRecords,
          });
        }

        return {
          module,
          video,
          mcqs: createdMCQs,
          traineesAssigned: company.users.length
        };
      });

      // Update progress to completed
      global.moduleCreationProgress[sessionId] = {
        status: 'completed',
        progress: 100,
        message: 'Module created successfully!',
        data: result,
        error: null
      };

      res.status(201).json({
        success: true,
        message: 'Module created successfully with video and MCQs',
        data: result,
        sessionId: sessionId
      });

    } catch (err) {
      console.error('Error in createModuleWithContent:', err);
      
      // Update progress to error
      global.moduleCreationProgress[sessionId] = {
        status: 'error',
        progress: 0,
        message: 'Failed to create module',
        data: null,
        error: err.message
      };

      res.status(500).json({ 
        success: false, 
        message: 'Failed to create module with content', 
        details: err.message,
        sessionId: sessionId
      });
    }
  },
  updateModule: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const module = await prisma.trainingModule.update({
        where: { id: Number(id) },
        data: { name },
      });
      res.json(module);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  deleteModule: async (req, res) => {
    try {
      const { id } = req.params;
      const moduleId = Number(id);
      // Check if module exists
      const module = await prisma.trainingModule.findUnique({
        where: { id: moduleId },
        include: {
          mcqs: true,
          videos: true,
          progress: true,
          mcqAnswers: true
        }
      });

      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
      // Delete related records first (due to foreign key constraints)
      // Delete MCQ answers first (they reference MCQs)
      const deletedAnswers = await prisma.mCQAnswer.deleteMany({
        where: { moduleId },
      });
      // Delete MCQs
      const deletedMCQs = await prisma.mCQ.deleteMany({
        where: { moduleId },
      });
      // Delete video
      const deletedVideos = await prisma.video.deleteMany({
        where: { moduleId },
      });
      // Delete trainee progress
      const deletedProgress = await prisma.traineeProgress.deleteMany({
        where: { moduleId },
      });
      // Delete help requests
      const deletedHelpRequests = await prisma.helpRequest.deleteMany({
        where: { moduleId },
      });
      // Delete feedback
      const deletedFeedback = await prisma.feedback.deleteMany({
        where: { moduleId },
      });
      // Delete resources
      const deletedResources = await prisma.resource.deleteMany({
        where: { moduleId },
      });
      // Finally delete the module
      await prisma.trainingModule.delete({
        where: { id: moduleId },
      });
      res.json({ message: 'Module deleted successfully' });
    } catch (err) {
      // Check for specific error types
      if (err.code === 'P2003') {
        res.status(400).json({ 
          message: 'Cannot delete module: It has related data that must be deleted first',
          details: err.message 
        });
      } else if (err.code === 'P2025') {
        res.status(404).json({ 
          message: 'Module not found',
          details: err.message 
        });
      } else {
        res.status(500).json({ 
          message: 'Server error', 
          details: err.message 
        });
      }
    }
  },
  addVideo: async (req, res) => {
    try {
      const { id } = req.params; 
      const { duration } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: 'Video file is required' });
      }
      
      if (!duration) {
        return res.status(400).json({ message: 'Video duration is required' });
      }

      // Validate and sanitize duration
      let videoDuration = Number(duration);
      if (isNaN(videoDuration) || !isFinite(videoDuration) || videoDuration <= 0) {
        return res.status(400).json({ message: 'Invalid video duration. Please provide a valid positive number.' });
      }
      await prisma.video.deleteMany({ where: { moduleId: Number(id) } });
      const video = await prisma.video.create({
        data: {
          url: `/uploads/${req.file.filename}`,
          duration: videoDuration,
          moduleId: Number(id),
        },
      });
      res.status(201).json(video);
    } catch (err) {
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  addMCQs: async (req, res) => {
    try {
      const { id } = req.params; 
      const { mcqs } = req.body;
      console.log('MCQs is array:', Array.isArray(mcqs));
      if (!Array.isArray(mcqs)) {
        return res.status(400).json({ message: 'MCQs must be an array' });
      }
      
      // Allow empty arrays (for removing all MCQs)
      if (mcqs.length === 0) {
        // Delete existing MCQ answers first (to handle foreign key constraints)
        await prisma.mCQAnswer.deleteMany({ where: { moduleId: Number(id) } });
        // Then delete MCQs
        await prisma.mCQ.deleteMany({ where: { moduleId: Number(id) } });
        res.status(201).json({ count: 0, message: 'All MCQs removed from module' });
        return;
      }
      
      // Validate each MCQ
      for (let i = 0; i < mcqs.length; i++) {
        const mcq = mcqs[i];
        if (!mcq.question || !mcq.options || !mcq.answer) {
          return res.status(400).json({ 
            message: `MCQ ${i + 1} is missing required fields (question, options, or answer)` 
          });
        }
        
        if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
          return res.status(400).json({ 
            message: `MCQ ${i + 1} must have at least 2 options` 
          });
        }
        
        if (!mcq.options.includes(mcq.answer)) {
          return res.status(400).json({ 
            message: `MCQ ${i + 1} answer must be one of the provided options` 
          });
        }
      }
      // Delete existing MCQ answers first (to handle foreign key constraints)
      await prisma.mCQAnswer.deleteMany({ where: { moduleId: Number(id) } });
      
      // Delete existing MCQs for this module (to handle updates)
      await prisma.mCQ.deleteMany({ where: { moduleId: Number(id) } });
      
      const created = await prisma.mCQ.createMany({
        data: mcqs.map(q => ({
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || null,
          moduleId: Number(id),
        })),
      });
      res.status(201).json({ count: created.count });
    } catch (err) {
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  getTraineeProgress: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get trainee info
      const trainee = await prisma.user.findUnique({
        where: { id: Number(id), role: 'TRAINEE' },
        include: { company: true }
      });

      if (!trainee) {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      // Get all progress records for this trainee
      const progressRecords = await prisma.traineeProgress.findMany({
        where: { userId: Number(id) },
        include: {
          module: {
            include: {
              videos: true,
              mcqs: true,
              resources: true
            },
          },
        },
        orderBy: { moduleId: 'asc' },
      });

      if (!progressRecords.length) {
        return res.json({
          trainee: {
            id: trainee.id,
            name: trainee.name,
            email: trainee.email,
            company: trainee.company
          },
          overallProgress: 0,
          modulesCompleted: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          moduleProgress: [],
          totalModules: 0,
          lastUpdated: new Date()
        });
      }

      const totalModules = progressRecords.length;
      const completedModules = progressRecords.filter(p => p.pass).length; // Use 'pass' instead of 'completed'
      const modulesWithScores = progressRecords.filter(p => p.score !== null);
      // Calculate average score across ALL modules (including those without scores as 0)
      const averageScore = totalModules > 0 
        ? progressRecords.reduce((sum, p) => sum + (p.score || 0), 0) / totalModules 
        : 0;
      const totalTime = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      
      // Calculate overall progress: each module is worth equal percentage
      const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

      const moduleProgress = progressRecords.map(p => ({
        moduleId: p.module.id,
        moduleName: p.module.name,
        score: p.score,
                    videoDuration: p.module.videos ? p.module.videos?.[0]?.duration : null,
        timeSpent: p.timeSpent || 0,
        pass: p.pass,
        completed: p.completed,
        // Fix status calculation: if time spent > 0 but not passed, it's "In Progress"
        status: p.pass ? 'Completed' : (p.timeSpent > 0 ? 'In Progress' : 'Not Started')
      }));

      res.json({
        trainee: {
          id: trainee.id,
          name: trainee.name,
          email: trainee.email,
          company: trainee.company
        },
        overallProgress: Math.round(overallProgress),
        modulesCompleted: completedModules,
        averageScore: Math.round(averageScore),
        totalTimeSpent: totalTime,
        moduleProgress,
        totalModules,
        lastUpdated: new Date()
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  assignTraineeToModules: async (req, res) => {
    try {
      const { traineeId, moduleIds } = req.body;
      
      if (!traineeId || !Array.isArray(moduleIds) || moduleIds.length === 0) {
        return res.status(400).json({ message: 'Trainee ID and module IDs array are required' });
      }

      // Check if trainee exists
      const trainee = await prisma.user.findUnique({
        where: { id: Number(traineeId), role: 'TRAINEE' },
      });

      if (!trainee) {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      // Check if modules exist
      const modules = await prisma.trainingModule.findMany({
        where: { id: { in: moduleIds.map(id => Number(id)) } },
      });

      if (modules.length !== moduleIds.length) {
        return res.status(404).json({ message: 'Some modules not found' });
      }

      // Remove existing progress records for this trainee
      await prisma.traineeProgress.deleteMany({
        where: { userId: Number(traineeId) },
      });

      // Create new progress records
      const progressRecords = moduleIds.map(moduleId => ({
        userId: Number(traineeId),
        moduleId: Number(moduleId),
        completed: false,
        score: null,
        timeSpent: null,
        pass: false,
      }));

      await prisma.traineeProgress.createMany({
        data: progressRecords,
      });

      res.json({ 
        message: 'Trainee assigned to modules successfully',
        traineeId: Number(traineeId),
        modulesAssigned: moduleIds.length,
        modules: modules.map(m => ({ id: m.id, name: m.name }))
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  assignTraineeToCompanyModules: async (req, res) => {
    try {
      const { traineeId } = req.params;
      
      // Check if trainee exists and get their company
      const trainee = await prisma.user.findUnique({
        where: { id: Number(traineeId), role: 'TRAINEE' },
        include: { company: true },
      });

      if (!trainee) {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      if (!trainee.companyId) {
        return res.status(400).json({ message: 'Trainee is not assigned to any company' });
      }

      // Get all modules for the trainee's company
      const companyModules = await prisma.trainingModule.findMany({
        where: { companyId: trainee.companyId },
      });

      if (companyModules.length === 0) {
        return res.status(404).json({ message: 'No modules found for this company' });
      }

      // Remove existing progress records for this trainee
      await prisma.traineeProgress.deleteMany({
        where: { userId: Number(traineeId) },
      });

      // Create new progress records for all company modules
      const progressRecords = companyModules.map(module => ({
        userId: Number(traineeId),
        moduleId: module.id,
        completed: false,
        score: null,
        timeSpent: null,
        pass: false,
      }));

      await prisma.traineeProgress.createMany({
        data: progressRecords,
      });

      res.json({ 
        message: 'Trainee assigned to company modules successfully',
        traineeId: Number(traineeId),
        companyName: trainee.company.name,
        modulesAssigned: companyModules.length,
        modules: companyModules.map(m => ({ id: m.id, name: m.name }))
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  getAllModules: async (req, res) => {
    try {
      const modules = await prisma.trainingModule.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          videos: {
            select: {
              id: true,
              url: true,
              duration: true,
            },
          },
          mcqs: {
            select: {
              id: true,
              question: true,
              options: true,
              answer: true,
              explanation: true,
            },
          },
          resources: {
            select: {
              id: true,
              filename: true,
              originalName: true,
              type: true,
              url: true,
              filePath: true,
            },
          },
        },
        orderBy: [
          { companyId: 'asc' },
          { id: 'asc' },
        ],
      });
      res.json(modules);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: { company: true },
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getHelpRequests: async (req, res) => {
    try {
      const helpRequests = await prisma.helpRequest.findMany({
        include: {
          trainee: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          },
          module: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      res.json(helpRequests);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateHelpRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      const helpRequest = await prisma.helpRequest.update({
        where: { id: Number(id) },
        data: {
          status,
          adminNotes: adminNotes || null,
          updatedAt: new Date()
        },
        include: {
          trainee: { select: { id: true, name: true, email: true, company: true } },
          module: { select: { id: true, name: true } }
        }
      });
      
      res.json({ 
        message: 'Help request updated successfully',
        helpRequest
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllFeedback: async (req, res) => {
    try {
      const feedback = await prisma.feedback.findMany({
        include: {
          user: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              company: { select: { id: true, name: true } }
            } 
          },
          module: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json(feedback);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFeedbackByModule: async (req, res) => {
    try {
      const { moduleId } = req.params;
      
      const feedback = await prisma.feedback.findMany({
        where: { moduleId: Number(moduleId) },
        include: {
          user: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              company: { select: { id: true, name: true } }
            } 
          },
          module: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json(feedback);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFeedbackStats: async (req, res) => {
    try {
      const totalFeedback = await prisma.feedback.count();
      const averageRating = await prisma.feedback.aggregate({
        _avg: { rating: true }
      });
      
      const ratingDistribution = await prisma.feedback.groupBy({
        by: ['rating'],
        _count: { rating: true }
      });
      
      // Get module feedback counts and averages
      const moduleFeedback = await prisma.feedback.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        _avg: { rating: true }
      });

      // Get module names for the feedback
      const moduleIds = moduleFeedback.map(mf => mf.moduleId);
      const modules = await prisma.trainingModule.findMany({
        where: { id: { in: moduleIds } },
        select: { id: true, name: true }
      });

      // Combine the data
      const moduleFeedbackWithNames = moduleFeedback.map(mf => ({
        ...mf,
        moduleName: modules.find(m => m.id === mf.moduleId)?.name || 'Unknown Module'
      }));
      
      res.json({
        totalFeedback,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution,
        moduleFeedback: moduleFeedbackWithNames
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  reorderModules: async (req, res) => {
    try {
      const { companyId, moduleOrders } = req.body || {};

      // Basic validation
      const parsedCompanyId = Number(companyId);
      if (!parsedCompanyId || !Number.isFinite(parsedCompanyId)) {
        return res.status(400).json({ success: false, message: 'Invalid companyId' });
      }
      if (!Array.isArray(moduleOrders) || moduleOrders.length === 0) {
        return res.status(400).json({ success: false, message: 'moduleOrders must be a non-empty array' });
      }

      // Coerce and validate each entry
      const sanitizedOrders = moduleOrders.map((mo) => ({
        id: Number(mo.id),
        order: Number(mo.order),
      }));
      if (sanitizedOrders.some((mo) => !Number.isInteger(mo.id) || !Number.isInteger(mo.order))) {
        return res.status(400).json({ success: false, message: 'Each module order must have numeric id and order' });
      }

      const moduleIds = sanitizedOrders.map((m) => m.id);

      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: parsedCompanyId },
        select: { id: true, name: true }
      });
      
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      // Ensure all modules exist and belong to the company
      const modules = await prisma.trainingModule.findMany({
        where: { id: { in: moduleIds }, companyId: parsedCompanyId },
        select: { id: true, name: true },
      });
      
      if (modules.length !== moduleIds.length) {
        return res.status(400).json({ success: false, message: 'Some modules were not found for the specified company' });
      }

      // Validate that order numbers are sequential and unique
      const sortedOrders = sanitizedOrders.sort((a, b) => a.order - b.order);
      for (let i = 0; i < sortedOrders.length; i++) {
        if (sortedOrders[i].order !== i + 1) {
          return res.status(400).json({ 
            success: false, 
            message: `Order numbers must be sequential starting from 1. Found order ${sortedOrders[i].order} at position ${i + 1}` 
          });
        }
      }
      
      // Check for duplicate order numbers
      const orderSet = new Set(sanitizedOrders.map(m => m.order));
      if (orderSet.size !== sanitizedOrders.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order numbers must be unique' 
        });
      }

      // Update inside a transaction
      await prisma.$transaction(async (tx) => {
        for (const { id, order } of sanitizedOrders) {
          await tx.trainingModule.update({ where: { id }, data: { order } });
        }
      });

      return res.json({ success: true, message: 'Module order updated successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update module orders', error: error.message });
    }
  },

  // Resource management methods
  addResource: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { moduleId, type, duration, estimatedReadingTime } = req.body;

      if (!moduleId || !type) {
        return res.status(400).json({ success: false, message: 'Module ID and type are required' });
      }

      // Create resource record
      const resource = await prisma.resource.create({
        data: {
          url: `/uploads/resources/${req.file.filename}`,
          filename: req.file.filename,
          originalName: req.file.originalname,
          type: type,
          duration: duration ? parseInt(duration) : null,
          estimatedReadingTime: estimatedReadingTime ? parseInt(estimatedReadingTime) : null,
          filePath: req.file.filename,
          moduleId: parseInt(moduleId)
        }
      });
      return res.json({ 
        success: true, 
        message: 'Resource uploaded successfully',
        resource: resource
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to upload resource', error: error.message });
    }
  },

  getModuleResources: async (req, res) => {
    try {
      const { moduleId } = req.params;

      const resources = await prisma.resource.findMany({
        where: { moduleId: parseInt(moduleId) },
        orderBy: { createdAt: 'desc' }
      });

      // Transform resources to match frontend expectations
      const transformedResources = resources.map(resource => ({
        id: resource.id,
        filename: resource.filename,
        originalName: resource.originalName || resource.filename, // fallback to filename
        filePath: resource.filePath || resource.url, // fallback to url
        url: resource.url, // Include the url field
        type: resource.type,
        duration: resource.duration,
        estimatedReadingTime: resource.estimatedReadingTime,
        moduleId: resource.moduleId,
        createdAt: resource.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: resource.updatedAt?.toISOString() || new Date().toISOString()
      }));

      return res.json({ success: true, resources: transformedResources });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch resources', error: error.message });
    }
  },

  deleteResource: async (req, res) => {
    try {
      const { id } = req.params;

      // Get resource to find file path
      const resource = await prisma.resource.findUnique({
        where: { id: parseInt(id) }
      });

      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      // Delete from database
      await prisma.resource.delete({
        where: { id: parseInt(id) }
      });

      // TODO: Delete physical file from uploads folder
      // const fs = require('fs');
      // const filePath = path.join(__dirname, '../uploads/resources', resource.filePath);
      // if (fs.existsSync(filePath)) {
      //   fs.unlinkSync(filePath);
      // }

      return res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete resource', error: error.message });
    }
  },

  // Manager management functions
  getManagers: async (req, res) => {
    try {
      const managers = await prisma.user.findMany({
        where: { role: 'MANAGER' },
        include: {
          managedCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      res.json({ success: true, managers });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch managers', error: error.message });
    }
  },

  createManager: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Find the first available company to assign to the manager
      const firstCompany = await prisma.company.findFirst({
        select: { id: true }
      });

      if (!firstCompany) {
        return res.status(400).json({ success: false, message: 'No company available to assign manager to' });
      }

      // Create manager
      const manager = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'MANAGER',
          isVerified: true,
          status: 'APPROVED',  // Managers created by admin are automatically approved
          companyId: firstCompany.id  // Assign manager to the first available company
        }
      });
      res.json({ success: true, manager });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create manager', error: error.message });
    }
  },

  updateManager: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;

      const updateData = { name, email };
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const manager = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          managedCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      res.json({ success: true, manager });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update manager', error: error.message });
    }
  },

  deleteManager: async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      res.json({ success: true, message: 'Manager deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete manager', error: error.message });
    }
  },

  getManagerCompanies: async (req, res) => {
    try {
      const { id } = req.params;

      const manager = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          managedCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      if (!manager) {
        return res.status(404).json({ success: false, message: 'Manager not found' });
      }

      res.json({ success: true, companies: manager.managedCompanies });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch manager companies', error: error.message });
    }
  },

  assignCompanyToManager: async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Company ID is required' });
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.managerCompanyAssignment.findUnique({
        where: {
          managerId_companyId: {
            managerId: parseInt(id),
            companyId: parseInt(companyId)
          }
        }
      });

      if (existingAssignment) {
        return res.status(400).json({ success: false, message: 'Company is already assigned to this manager' });
      }

      const assignment = await prisma.managerCompanyAssignment.create({
        data: {
          managerId: parseInt(id),
          companyId: parseInt(companyId)
        },
        include: {
          company: true
        }
      });

      res.json({ success: true, assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to assign company to manager', error: error.message });
    }
  },

  unassignCompanyFromManager: async (req, res) => {
    try {
      const { id, companyId } = req.params;

      await prisma.managerCompanyAssignment.deleteMany({
        where: {
          managerId: parseInt(id),
          companyId: parseInt(companyId)
        }
      });

      res.json({ success: true, message: 'Company unassigned from manager successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to unassign company from manager', error: error.message });
    }
  },

  // Progress tracking for module creation
  getModuleCreationProgress: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // In a real implementation, you'd store this in Redis or database
      // For now, we'll use a simple in-memory store
      const progress = global.moduleCreationProgress || {};
      const sessionProgress = progress[sessionId];
      
      if (!sessionProgress) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      res.json({
        success: true,
        data: sessionProgress
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to get progress',
        details: err.message
      });
    }
  },

  // Duplicate company data functionality
  duplicateCompanyData: async (req, res) => {
    try {
      console.log('Starting duplicate company data process...');
      const { sourceCompanyId, targetCompanyId } = req.body;
      console.log('Request body:', { sourceCompanyId, targetCompanyId });

      // Validate input
      if (!sourceCompanyId || !targetCompanyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Source and target company IDs are required' 
        });
      }

      if (sourceCompanyId === targetCompanyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Source and target companies cannot be the same' 
        });
      }

      // Check if both companies exist
      const [sourceCompany, targetCompany] = await Promise.all([
        prisma.company.findUnique({ 
          where: { id: parseInt(sourceCompanyId) },
          include: {
            modules: {
              include: {
                videos: true,
                mcqs: true,
                resources: true
              }
            }
          }
        }),
        prisma.company.findUnique({ 
          where: { id: parseInt(targetCompanyId) },
          include: {
            modules: true
          }
        })
      ]);

      if (!sourceCompany) {
        return res.status(404).json({ 
          success: false, 
          message: 'Source company not found' 
        });
      }

      if (!targetCompany) {
        return res.status(404).json({ 
          success: false, 
          message: 'Target company not found' 
        });
      }

      // Check if target company already has modules
      if (targetCompany.modules && targetCompany.modules.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Target company already has modules. Please delete existing modules first or choose a different company.' 
        });
      }



      // Get all trainees in target company for progress assignment
      const targetTrainees = await prisma.user.findMany({
        where: { 
          companyId: parseInt(targetCompanyId),
          role: 'TRAINEE'
        }
      });

      // Duplicate all data in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const duplicatedModules = [];
        const duplicatedVideos = [];
        const duplicatedMCQs = [];
        const duplicatedResources = [];
        const progressRecords = [];

        // Duplicate modules and their related data
        for (const sourceModule of sourceCompany.modules) {
          try {
            // Create new module
            const newModule = await tx.trainingModule.create({
              data: {
                name: sourceModule.name,
                companyId: parseInt(targetCompanyId),
                order: sourceModule.order,
                isResourceModule: sourceModule.isResourceModule
              }
            });
            duplicatedModules.push(newModule);

          // Duplicate videos
          for (const sourceVideo of sourceModule.videos) {
            const { id, ...videoDataWithoutId } = sourceVideo;
            const newVideo = await tx.video.create({
              data: {
                url: videoDataWithoutId.url,
                duration: videoDataWithoutId.duration,
                moduleId: newModule.id
              }
            });
            duplicatedVideos.push(newVideo);
          }

        // Duplicate MCQs using createMany to avoid individual id conflicts
        if (sourceModule.mcqs && sourceModule.mcqs.length > 0) {
          try {
            const mcqDataArray = sourceModule.mcqs.map(sourceMCQ => ({
              question: String(sourceMCQ.question),
              options: Array.isArray(sourceMCQ.options) ? [...sourceMCQ.options] : [],
              answer: String(sourceMCQ.answer),
              explanation: sourceMCQ.explanation ? String(sourceMCQ.explanation) : null,
              moduleId: newModule.id
            }));
            
            console.log(`Creating ${mcqDataArray.length} MCQs for module ${newModule.id}`);
            console.log(`MCQ data sample:`, JSON.stringify(mcqDataArray[0], null, 2));
            
            const result = await tx.mCQ.createMany({
              data: mcqDataArray
            });
            
            console.log(`Successfully created ${result.count} MCQs for module ${newModule.id}`);
            
            // Fetch the created MCQs to add to our tracking array
            const createdMCQs = await tx.mCQ.findMany({
              where: { moduleId: newModule.id },
              orderBy: { id: 'desc' },
              take: result.count
            });
            duplicatedMCQs.push(...createdMCQs);
            
          } catch (mcqError) {
            console.error(`Error duplicating MCQs for module ${newModule.id}:`, mcqError.message);
            console.error(`MCQ data array:`, JSON.stringify(sourceModule.mcqs.map(mcq => ({
              question: mcq.question,
              options: mcq.options,
              answer: mcq.answer,
              explanation: mcq.explanation
            })), null, 2));
            throw mcqError; // Re-throw to abort the transaction
          }
        }

          // Duplicate resources
          for (const sourceResource of sourceModule.resources) {
            try {
              // Check if the source file exists before duplicating
              const fs = require('fs');
              const path = require('path');
              // Extract just the filename from the full path if it exists
              let filename = sourceResource.filePath;
              if (sourceResource.filePath.includes('\\')) {
                filename = path.basename(sourceResource.filePath);
              }
              const sourceFilePath = path.join(__dirname, '../../../uploads/resources', filename);
              
              if (fs.existsSync(sourceFilePath)) {
                const { id, ...resourceDataWithoutId } = sourceResource;
                const newResource = await tx.resource.create({
                  data: {
                    url: resourceDataWithoutId.url,
                    filename: resourceDataWithoutId.filename,
                    originalName: resourceDataWithoutId.originalName,
                    filePath: resourceDataWithoutId.filePath,
                    type: resourceDataWithoutId.type,
                    duration: resourceDataWithoutId.duration,
                    estimatedReadingTime: resourceDataWithoutId.estimatedReadingTime,
                    moduleId: newModule.id
                  }
                });
                duplicatedResources.push(newResource);
                console.log(`Successfully duplicated resource: ${sourceResource.originalName}`);
              } else {
                console.warn(`Source file not found, skipping resource: ${sourceResource.originalName} (${sourceFilePath})`);
                // Still create the resource record but with a note about missing file
                const { id, ...resourceDataWithoutId } = sourceResource;
                const newResource = await tx.resource.create({
                  data: {
                    url: resourceDataWithoutId.url,
                    filename: resourceDataWithoutId.filename,
                    originalName: resourceDataWithoutId.originalName,
                    filePath: resourceDataWithoutId.filePath,
                    type: resourceDataWithoutId.type,
                    duration: resourceDataWithoutId.duration,
                    estimatedReadingTime: resourceDataWithoutId.estimatedReadingTime,
                    moduleId: newModule.id
                  }
                });
                duplicatedResources.push(newResource);
              }
            } catch (fileError) {
              console.error(`Error processing resource ${sourceResource.originalName}:`, fileError.message);
              // Continue with other resources even if one fails
            }
          }

          // Create progress records for all trainees in target company
          for (const trainee of targetTrainees) {
            progressRecords.push({
              userId: trainee.id,
              moduleId: newModule.id,
              completed: false,
              score: null,
              timeSpent: null,
              pass: false
            });
          }
          } catch (moduleError) {
            console.error(`Error duplicating module ${sourceModule.name}:`, moduleError.message);
            throw moduleError; // Re-throw to abort the transaction
          }
        }

        // Create all progress records
        if (progressRecords.length > 0) {
          await tx.traineeProgress.createMany({
            data: progressRecords
          });
        }

        return {
          modules: duplicatedModules,
          videos: duplicatedVideos,
          mcqs: duplicatedMCQs,
          resources: duplicatedResources,
          progressRecords: progressRecords.length
        };
      });

      res.json({
        success: true,
        message: `Successfully duplicated ${sourceCompany.name} data to ${targetCompany.name}`,
        data: {
          sourceCompany: sourceCompany.name,
          targetCompany: targetCompany.name,
          duplicatedModules: result.modules.length,
          duplicatedVideos: result.videos.length,
          duplicatedMCQs: result.mcqs.length,
          duplicatedResources: result.resources.length,
          progressRecordsCreated: result.progressRecords
        }
      });

    } catch (error) {
      console.error('Error in duplicateCompanyData:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to duplicate company data', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Manager-specific functions
  getCompanyTrainees: async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const trainees = await prisma.user.findMany({
        where: {
          companyId: parseInt(companyId),
          role: 'TRAINEE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          companyId: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({ success: true, trainees });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get company trainees', error: error.message });
    }
  },

  // Comprehensive time tracking endpoint
  getTimeTrackingStats: async (req, res) => {
    try {
      const { traineeId, companyId, startDate, endDate } = req.query;
      
      // Build where clause based on filters
      let whereClause = {};
      
      if (traineeId) {
        whereClause.userId = parseInt(traineeId);
      }
      
      if (companyId) {
        whereClause.user = {
          companyId: parseInt(companyId)
        };
      }
      
      if (startDate || endDate) {
        whereClause.updatedAt = {};
        if (startDate) {
          whereClause.updatedAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.updatedAt.lte = new Date(endDate);
        }
      }

      // Get all progress records with time tracking
      const progressRecords = await prisma.traineeProgress.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          module: {
            select: {
              id: true,
              name: true,
              videos: {
                select: {
                  duration: true
                }
              }
            }
          }
        },
        orderBy: [
          { userId: 'asc' },
          { moduleId: 'asc' }
        ]
      });

      // Calculate comprehensive time statistics
      const stats = {
        totalTrainees: 0,
        totalModules: 0,
        totalTimeSpent: 0,
        averageTimePerTrainee: 0,
        averageTimePerModule: 0,
        timeDistribution: {
          under30min: 0,
          thirtyTo60min: 0,
          oneTo2hours: 0,
          twoTo4hours: 0,
          over4hours: 0
        },
        traineeStats: [],
        moduleStats: [],
        companyStats: []
      };

      // Group by trainee
      const traineeGroups = {};
      progressRecords.forEach(record => {
        const traineeId = record.userId;
        if (!traineeGroups[traineeId]) {
          traineeGroups[traineeId] = {
            trainee: record.user,
            records: [],
            totalTime: 0,
            completedModules: 0,
            averageScore: 0
          };
        }
        traineeGroups[traineeId].records.push(record);
        traineeGroups[traineeId].totalTime += record.timeSpent || 0;
        if (record.pass) {
          traineeGroups[traineeId].completedModules++;
        }
      });

      // Calculate trainee statistics
      Object.values(traineeGroups).forEach(group => {
        const totalModules = group.records.length;
        const completedModules = group.completedModules;
        const totalTime = group.totalTime;
        const averageScore = totalModules > 0 ? 
          group.records.reduce((sum, r) => sum + (r.score || 0), 0) / totalModules : 0;

        stats.totalTrainees++;
        stats.totalTimeSpent += totalTime;
        stats.totalModules += totalModules;

        // Time distribution
        const timeInMinutes = totalTime / 60;
        if (timeInMinutes < 30) {
          stats.timeDistribution.under30min++;
        } else if (timeInMinutes < 60) {
          stats.timeDistribution.thirtyTo60min++;
        } else if (timeInMinutes < 120) {
          stats.timeDistribution.oneTo2hours++;
        } else if (timeInMinutes < 240) {
          stats.timeDistribution.twoTo4hours++;
        } else {
          stats.timeDistribution.over4hours++;
        }

        stats.traineeStats.push({
          traineeId: group.trainee.id,
          traineeName: group.trainee.name,
          traineeEmail: group.trainee.email,
          company: group.trainee.company,
          totalTimeSpent: totalTime,
          totalModules: totalModules,
          completedModules: completedModules,
          completionRate: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
          averageScore: Math.round(averageScore),
          timeInHours: Math.round(totalTime / 3600 * 10) / 10,
          timeInMinutes: Math.round(totalTime / 60)
        });
      });

      // Calculate averages
      if (stats.totalTrainees > 0) {
        stats.averageTimePerTrainee = Math.round(stats.totalTimeSpent / stats.totalTrainees);
      }
      if (stats.totalModules > 0) {
        stats.averageTimePerModule = Math.round(stats.totalTimeSpent / stats.totalModules);
      }

      // Group by company for company statistics
      const companyGroups = {};
      stats.traineeStats.forEach(trainee => {
        const companyId = trainee.company?.id;
        if (companyId) {
          if (!companyGroups[companyId]) {
            companyGroups[companyId] = {
              companyName: trainee.company.name,
              traineeCount: 0,
              totalTime: 0,
              totalModules: 0,
              completedModules: 0
            };
          }
          companyGroups[companyId].traineeCount++;
          companyGroups[companyId].totalTime += trainee.totalTimeSpent;
          companyGroups[companyId].totalModules += trainee.totalModules;
          companyGroups[companyId].completedModules += trainee.completedModules;
        }
      });

      stats.companyStats = Object.values(companyGroups).map(company => ({
        companyName: company.companyName,
        traineeCount: company.traineeCount,
        totalTimeSpent: company.totalTime,
        averageTimePerTrainee: company.traineeCount > 0 ? 
          Math.round(company.totalTime / company.traineeCount) : 0,
        completionRate: company.totalModules > 0 ? 
          (company.completedModules / company.totalModules) * 100 : 0
      }));

      // Sort trainee stats by total time spent (descending)
      stats.traineeStats.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);

      res.json({
        success: true,
        stats,
        generatedAt: new Date()
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get time tracking statistics', 
        error: error.message 
      });
    }
  },

  // Get all trainees with their status and company info
  getAllTrainees: async (req, res) => {
    try {
      const trainees = await prisma.user.findMany({
        where: {
          role: 'TRAINEE'
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json({
        success: true,
        trainees: trainees
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trainees',
        error: error.message
      });
    }
  },


  // Get notifications for a user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const notifications = await NotificationService.getUserNotifications(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({
        success: true,
        notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      await NotificationService.markAsRead(parseInt(notificationId), userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  },

  // Mark all notifications as read for a user
  markAllNotificationsAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  },

  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;

      const count = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount: count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  },

  // Certificate endpoints
  generateCertificate: async (req, res) => {
    try {
      const { userId, companyId } = req.body;

      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Company ID are required'
        });
      }

      const certificate = await CertificateService.generateCertificate(userId, companyId);

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
  },

  getAllCertificates: async (req, res) => {
    try {
      const certificates = await CertificateService.getAllCertificates();

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

  getCertificatesByCompany: async (req, res) => {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      const certificates = await CertificateService.getCertificateByCompany(parseInt(companyId));

      res.json({
        success: true,
        certificates: certificates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company certificates',
        error: error.message
      });
    }
  },

  getCertificateById: async (req, res) => {
    try {
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

      res.json({
        success: true,
        certificate: certificate
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificate',
        error: error.message
      });
    }
  },

  downloadCertificate: async (req, res) => {
    try {
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

      if (!certificate.pdfPath) {
        return res.status(404).json({
          success: false,
          message: 'Certificate PDF not found'
        });
      }

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

  revokeCertificate: async (req, res) => {
    try {
      const { certificateId } = req.params;

      if (!certificateId) {
        return res.status(400).json({
          success: false,
          message: 'Certificate ID is required'
        });
      }

      const certificate = await CertificateService.revokeCertificate(parseInt(certificateId));

      res.json({
        success: true,
        certificate: certificate,
        message: 'Certificate revoked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to revoke certificate',
        error: error.message
      });
    }
  }
}; 