const prisma = require('../prismaClient');
const path = require('path');
const bcrypt = require('bcrypt');

module.exports = {
  // Simple test endpoint
  testEndpoint: async (req, res) => {
    try {
      res.json({ message: 'Admin API is working', timestamp: new Date() });
    } catch (err) {
      console.error('Error in test endpoint:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  getTrainees: async (req, res) => {
    try {
      console.log('=== GET TRAINEES DEBUG ===');
      console.log('Request headers:', req.headers);
      console.log('User from request:', req.user);
      
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
      
      console.log('Raw trainees data:', trainees);
      
      // Calculate progress for each trainee
      const traineesWithProgress = trainees.map(trainee => {
        try {
          const progressRecords = trainee.progress || [];
          const totalModules = progressRecords.length;
          
          console.log(`Processing trainee ${trainee.id}: ${totalModules} progress records`);
          
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

          console.log(`Trainee ${trainee.id} progress: ${completedModules}/${totalModules} completed, ${overallProgress}% overall, ${modulesWithScores.length} modules with scores, total time: ${totalTime} seconds, average score: ${averageScore}%`);

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
          console.error(`Error processing trainee ${trainee.id}:`, traineeError);
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
      
      console.log('Found trainees:', traineesWithProgress.length);
      console.log('Trainees data with progress:', traineesWithProgress);
      
      res.json(traineesWithProgress);
    } catch (err) {
      console.error('Error in getTrainees:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ message: 'Server error', details: err.message });
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
      console.error('Error creating trainee:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  updateTrainee: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, companyId } = req.body;
      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user || user.role !== 'TRAINEE') {
        return res.status(404).json({ message: 'Trainee not found' });
      }
      let data = {};
      if (name) data.name = name;
      if (email) data.email = email;
      if (companyId) {
        const company = await prisma.company.findUnique({ where: { id: Number(companyId) } });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        data.companyId = Number(companyId);
      }
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }
      const updated = await prisma.user.update({ where: { id: Number(id) }, data });
      res.json({ message: 'Trainee updated', user: { id: updated.id, name: updated.name, email: updated.email } });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  deleteTrainee: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user || user.role !== 'TRAINEE') {
        return res.status(404).json({ message: 'Trainee not found' });
      }

      console.log(`Deleting trainee ${id} and related records...`);

      // Delete related records first to avoid foreign key constraint violations
      await prisma.$transaction(async (tx) => {
        // Delete MCQ answers for this user (if any exist)
        const deletedAnswers = await tx.mCQAnswer.deleteMany({
          where: { userId: Number(id) }
        });
        console.log(`Deleted ${deletedAnswers.count} MCQ answers`);

        // Delete trainee progress records for this user (if any exist)
        const deletedProgress = await tx.traineeProgress.deleteMany({
          where: { userId: Number(id) }
        });
        console.log(`Deleted ${deletedProgress.count} progress records`);

        // Finally delete the user
        await tx.user.delete({ where: { id: Number(id) } });
        console.log(`Deleted user ${id}`);
      });

      res.json({ message: 'Trainee deleted successfully' });
    } catch (err) {
      console.error('Error deleting trainee:', err);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  getCompanies: async (req, res) => {
    try {
      const companies = await prisma.company.findMany();
      res.json(companies);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
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

      console.log(`Deleting company ${companyId} and all related data...`);
      console.log(`Company has ${company.users.length} trainees and ${company.modules.length} modules`);

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
          console.log(`Deleted ${deletedNotifications.count} notifications`);
        } catch (error) {
          console.log('No notifications to delete or notifications table does not exist');
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
          console.log(`Deleted ${deletedFeedback.count} feedback records`);
        } catch (error) {
          console.log('No feedback to delete or feedback table does not exist');
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
          console.log(`Deleted ${deletedHelpRequests.count} help requests`);
        } catch (error) {
          console.log('No help requests to delete or help requests table does not exist');
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
          console.log(`Deleted ${deletedChatMessages.count} chat messages`);
        } catch (error) {
          console.log('No chat messages to delete or chat messages table does not exist');
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
          console.log(`Deleted ${deletedChatParticipants.count} chat room participants`);
        } catch (error) {
          console.log('No chat room participants to delete or chat room participants table does not exist');
        }

        try {
          // Delete all chat rooms for this company
          const deletedChatRooms = await tx.chatRoom.deleteMany({
            where: {
              companyId: companyId
            }
          });
          console.log(`Deleted ${deletedChatRooms.count} chat rooms`);
        } catch (error) {
          console.log('No chat rooms to delete or chat rooms table does not exist');
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
          console.log(`Deleted ${deletedMcqAnswers.count} MCQ answers`);
        } catch (error) {
          console.log('No MCQ answers to delete or MCQ answers table does not exist');
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
          console.log(`Deleted ${deletedProgress.count} progress records`);
        } catch (error) {
          console.log('No trainee progress to delete or trainee progress table does not exist');
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
          console.log(`Deleted ${deletedTraineeMcqAnswers.count} trainee MCQ answers`);
        } catch (error) {
          console.log('No trainee MCQ answers to delete or trainee MCQ answers table does not exist');
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
          console.log(`Deleted ${deletedTraineeProgress.count} trainee progress records`);
        } catch (error) {
          console.log('No trainee progress to delete or trainee progress table does not exist');
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
          console.log(`Deleted ${deletedMcqs.count} MCQs`);
        } catch (error) {
          console.log('No MCQs to delete or MCQs table does not exist');
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
          console.log(`Deleted ${deletedVideos.count} videos`);
        } catch (error) {
          console.log('No videos to delete or videos table does not exist');
        }

        try {
          // Delete all modules in this company
          const deletedModules = await tx.trainingModule.deleteMany({
            where: {
              companyId: companyId
            }
          });
          console.log(`Deleted ${deletedModules.count} modules`);
        } catch (error) {
          console.log('No modules to delete or modules table does not exist');
        }

        try {
          // Delete all trainees in this company
          const deletedTrainees = await tx.user.deleteMany({
            where: {
              companyId: companyId
            }
          });
          console.log(`Deleted ${deletedTrainees.count} trainees`);
        } catch (error) {
          console.log('No trainees to delete or trainees table does not exist');
        }

        try {
          // Finally delete the company
          await tx.company.delete({
            where: { id: companyId }
          });
          console.log(`Deleted company ${companyId}`);
        } catch (error) {
          console.error('Failed to delete company:', error);
          throw new Error(`Failed to delete company: ${error.message}`);
        }
      });

      res.json({ message: 'Company and all related data deleted successfully' });
    } catch (err) {
      console.error('Error deleting company:', err);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  addModule: async (req, res) => {
    try {
      const { id } = req.params; 
      const { name } = req.body;
      
      console.log('=== ADD MODULE DEBUG ===');
      console.log('Company ID:', id);
      console.log('Module name:', name);
      console.log('Request body:', req.body);
      
      if (!name) {
        console.log('Validation failed: Module name is required');
        return res.status(400).json({ message: 'Module name is required' });
      }
      
      // Check if company exists
      console.log('Checking if company exists...');
      const company = await prisma.company.findUnique({
        where: { id: Number(id) },
        include: {
          users: {
            where: { role: 'TRAINEE' }
          }
        }
      });
      
      if (!company) {
        console.log('Company not found with ID:', id);
        return res.status(404).json({ message: 'Company not found' });
      }

      console.log('Company found:', company.name);
      console.log('Trainees in company:', company.users.length);

      console.log('Creating module...');
      const module = await prisma.trainingModule.create({
        data: {
          name,
          companyId: Number(id),
        },
      });

      console.log('Module created successfully:', module);

      // Automatically assign all trainees in this company to the new module
      if (company.users.length > 0) {
        console.log('Assigning trainees to module...');
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
        console.log('Trainees assigned successfully');
      }

      console.log('Module creation completed successfully');
      res.status(201).json({
        message: 'Module created and assigned to trainees',
        module,
        traineesAssigned: company.users.length
      });
    } catch (err) {
      console.error('=== ADD MODULE ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      res.status(500).json({ message: 'Server error', details: err.message });
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

      console.log('=== DELETE MODULE DEBUG ===');
      console.log('Module ID to delete:', moduleId);

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
        console.log('Module not found with ID:', moduleId);
        return res.status(404).json({ message: 'Module not found' });
      }

      console.log('Module found:', {
        id: module.id,
        name: module.name,
        mcqsCount: module.mcqs?.length || 0,
        hasVideo: !!module.videos?.lengths,
        progressCount: module.progress?.length || 0,
        mcqAnswersCount: module.mcqAnswers?.length || 0
      });

      // Delete related records first (due to foreign key constraints)
      console.log('Deleting related records...');

      // Delete MCQ answers first (they reference MCQs)
      const deletedAnswers = await prisma.mCQAnswer.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted MCQ answers:', deletedAnswers.count);

      // Delete MCQs
      const deletedMCQs = await prisma.mCQ.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted MCQs:', deletedMCQs.count);

      // Delete video
      const deletedVideos = await prisma.video.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted videos:', deletedVideos.count);

      // Delete trainee progress
      const deletedProgress = await prisma.traineeProgress.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted progress records:', deletedProgress.count);

      // Delete help requests
      const deletedHelpRequests = await prisma.helpRequest.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted help requests:', deletedHelpRequests.count);

      // Delete feedback
      const deletedFeedback = await prisma.feedback.deleteMany({
        where: { moduleId },
      });
      console.log('Deleted feedback:', deletedFeedback.count);

      // Finally delete the module
      console.log('Deleting module...');
      await prisma.trainingModule.delete({
        where: { id: moduleId },
      });

      console.log('Module deleted successfully');
      res.json({ message: 'Module deleted successfully' });
    } catch (err) {
      console.error('=== DELETE MODULE ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Check for specific error types
      if (err.code === 'P2003') {
        console.error('Foreign key constraint violation');
        res.status(400).json({ 
          message: 'Cannot delete module: It has related data that must be deleted first',
          details: err.message 
        });
      } else if (err.code === 'P2025') {
        console.error('Record not found');
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
      
      console.log('=== ADD VIDEO DEBUG ===');
      console.log('Module ID:', id);
      console.log('Duration:', duration);
      console.log('Duration type:', typeof duration);
      console.log('File:', req.file);
      
      if (!req.file) {
        console.log('Validation failed: No video file uploaded');
        return res.status(400).json({ message: 'Video file is required' });
      }
      
      if (!duration) {
        console.log('Validation failed: No duration provided');
        return res.status(400).json({ message: 'Video duration is required' });
      }

      // Validate and sanitize duration
      let videoDuration = Number(duration);
      if (isNaN(videoDuration) || !isFinite(videoDuration) || videoDuration <= 0) {
        console.log('Invalid duration value:', duration);
        return res.status(400).json({ message: 'Invalid video duration. Please provide a valid positive number.' });
      }

      console.log('Validated duration:', videoDuration);

      console.log('Deleting existing videos for module...');
      await prisma.video.deleteMany({ where: { moduleId: Number(id) } });
      
      console.log('Creating new video record...');
      const video = await prisma.video.create({
        data: {
          url: req.file.filename,
          duration: videoDuration,
          moduleId: Number(id),
        },
      });
      
      console.log('Video created successfully:', video);
      res.status(201).json(video);
    } catch (err) {
      console.error('=== ADD VIDEO ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  },
  addMCQs: async (req, res) => {
    try {
      const { id } = req.params; 
      const { mcqs } = req.body;
      
      console.log('=== ADD MCQS DEBUG ===');
      console.log('Module ID:', id);
      console.log('Request body:', req.body);
      console.log('MCQs data:', mcqs);
      console.log('MCQs type:', typeof mcqs);
      console.log('MCQs is array:', Array.isArray(mcqs));
      console.log('MCQs length:', mcqs ? mcqs.length : 'undefined');
      
      if (!Array.isArray(mcqs)) {
        console.log('Validation failed: MCQs is not an array');
        return res.status(400).json({ message: 'MCQs must be an array' });
      }
      
      // Allow empty arrays (for removing all MCQs)
      if (mcqs.length === 0) {
        console.log('MCQs array is empty, deleting all existing MCQs for module');
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
        console.log(`Validating MCQ ${i + 1}:`, mcq);
        
        if (!mcq.question || !mcq.options || !mcq.answer) {
          console.log(`MCQ ${i + 1} validation failed: missing required fields`);
          console.log(`Question: ${mcq.question}`);
          console.log(`Options: ${mcq.options}`);
          console.log(`Answer: ${mcq.answer}`);
          return res.status(400).json({ 
            message: `MCQ ${i + 1} is missing required fields (question, options, or answer)` 
          });
        }
        
        if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
          console.log(`MCQ ${i + 1} validation failed: options must be an array with at least 2 items`);
          return res.status(400).json({ 
            message: `MCQ ${i + 1} must have at least 2 options` 
          });
        }
        
        if (!mcq.options.includes(mcq.answer)) {
          console.log(`MCQ ${i + 1} validation failed: answer must be one of the options`);
          console.log(`Answer: ${mcq.answer}`);
          console.log(`Options: ${mcq.options}`);
          return res.status(400).json({ 
            message: `MCQ ${i + 1} answer must be one of the provided options` 
          });
        }
      }
      
      console.log('All MCQs validated successfully. Creating MCQs in database...');
      
      // Delete existing MCQ answers first (to handle foreign key constraints)
      console.log('Deleting existing MCQ answers for module...');
      await prisma.mCQAnswer.deleteMany({ where: { moduleId: Number(id) } });
      
      // Delete existing MCQs for this module (to handle updates)
      console.log('Deleting existing MCQs for module...');
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
      
      console.log('MCQs created successfully:', created);
      res.status(201).json({ count: created.count });
    } catch (err) {
      console.error('=== ADD MCQS ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
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
      console.error('Error in getTraineeProgress:', err);
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
      console.error('Error assigning trainee to modules:', err);
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
      console.error('Error assigning trainee to company modules:', err);
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
        },
        orderBy: [
          { companyId: 'asc' },
          { id: 'asc' },
        ],
      });
      res.json(modules);
    } catch (err) {
      console.error(err);
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
      console.error('Error getting help requests:', err);
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
      console.error('Error in updateHelpRequest:', err);
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
      console.error('Error in getAllFeedback:', err);
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
      console.error('Error in getFeedbackByModule:', err);
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
      console.error('Error in getFeedbackStats:', err);
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

      // Update inside a transaction
      await prisma.$transaction(async (tx) => {
        for (const { id, order } of sanitizedOrders) {
          await tx.trainingModule.update({ where: { id }, data: { order } });
        }
      });

      return res.json({ success: true, message: 'Module order updated successfully' });
    } catch (error) {
      console.error('Error in reorderModules:', error);
      return res.status(500).json({ success: false, message: 'Failed to update module orders', error: error.message });
    }
  },
}; 