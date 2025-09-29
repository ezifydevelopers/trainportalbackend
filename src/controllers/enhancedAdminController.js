const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Enhanced module creation with sequential upload handling
const createModuleWithSequentialUpload = async (req, res) => {
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
    error: null,
    currentStep: 'video_upload'
  };

  try {
    const { companyId, name, isResourceModule, duration, mcqs } = req.body;
    
    // Update progress - Validation
    global.moduleCreationProgress[sessionId] = {
      status: 'validating',
      progress: 5,
      message: 'Validating input data...',
      data: null,
      error: null,
      currentStep: 'video_upload'
    };

    // Validation
    if (!companyId || !name) {
      global.moduleCreationProgress[sessionId] = {
        status: 'error',
        progress: 0,
        message: 'Validation failed',
        data: null,
        error: 'Company ID and module name are required',
        currentStep: 'video_upload'
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
        error: 'Video file is required',
        currentStep: 'video_upload'
      };
      return res.status(400).json({ 
        success: false, 
        message: 'Video file is required' 
      });
    }

    // Parse MCQs if provided
    let mcqData = [];
    if (mcqs && Array.isArray(mcqs)) {
      mcqData = mcqs.map(mcq => ({
        question: mcq.question,
        options: mcq.options,
        answer: mcq.answer,
        explanation: mcq.explanation || null,
        moduleId: null // Will be set after module creation
      }));
    }

    // Step 1: Create module first
    global.moduleCreationProgress[sessionId] = {
      status: 'creating_module',
      progress: 10,
      message: 'Creating module...',
      data: null,
      error: null,
      currentStep: 'module_creation'
    };

    // Get the next order number for this company
    const lastModule = await prisma.trainingModule.findFirst({
      where: { companyId: Number(companyId) },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    
    const nextOrder = (lastModule?.order || 0) + 1;

    const module = await prisma.trainingModule.create({
      data: {
        name: String(name),
        companyId: Number(companyId),
        isResourceModule: Boolean(isResourceModule),
        order: nextOrder,
      },
    });

    // Update progress - Video upload starting
    global.moduleCreationProgress[sessionId] = {
      status: 'uploading_video',
      progress: 20,
      message: 'Starting video upload...',
      data: { module },
      error: null,
      currentStep: 'video_upload'
    };

    // Step 2: Upload video
    const videoPath = `/uploads/${req.file.filename}`;
    const video = await prisma.video.create({
      data: {
        url: videoPath,
        duration: parseInt(duration) || 0,
        moduleId: module.id,
      },
    });

    // Update progress - Video uploaded
    global.moduleCreationProgress[sessionId] = {
      status: 'uploading_mcqs',
      progress: 60,
      message: 'Video uploaded successfully! Processing MCQs...',
      data: { module, video },
      error: null,
      currentStep: 'mcq_upload'
    };

    // Step 3: Create MCQs if provided
    let createdMCQs = [];
    if (mcqData.length > 0) {
      const mcqDataWithModuleId = mcqData.map(mcq => ({
        ...mcq,
        moduleId: module.id
      }));

      await prisma.mCQ.createMany({
        data: mcqDataWithModuleId
      });

      // Fetch created MCQs
      createdMCQs = await prisma.mCQ.findMany({
        where: { moduleId: module.id }
      });

      // Update progress - MCQs created
      global.moduleCreationProgress[sessionId] = {
        status: 'creating_module',
        progress: 80,
        message: 'MCQs processed successfully! Finalizing module...',
        data: { module, video, mcqs: createdMCQs },
        error: null,
        currentStep: 'module_creation'
      };
    }

    // Step 4: Assign module to all trainees in the company
    const trainees = await prisma.user.findMany({
      where: { 
        companyId: Number(companyId),
        role: 'TRAINEE'
      },
      select: { id: true }
    });

    if (trainees.length > 0) {
      const progressRecords = trainees.map(trainee => ({
        userId: trainee.id,
        moduleId: module.id,
        completed: false,
        pass: false,
        score: null
      }));

      await prisma.traineeProgress.createMany({
        data: progressRecords
      });
    }

    // Final success
    global.moduleCreationProgress[sessionId] = {
      status: 'completed',
      progress: 100,
      message: 'Module created successfully!',
      data: { 
        module, 
        video, 
        mcqs: createdMCQs,
        traineesAssigned: trainees.length
      },
      error: null,
      currentStep: 'module_creation'
    };

    res.json({
      success: true,
      message: 'Module created successfully',
      sessionId,
      data: {
        module,
        video,
        mcqs: createdMCQs,
        traineesAssigned: trainees.length
      }
    });

  } catch (error) {
    console.error('Error in createModuleWithSequentialUpload:', error);
    
    global.moduleCreationProgress[sessionId] = {
      status: 'error',
      progress: 0,
      message: 'Module creation failed',
      data: null,
      error: error.message,
      currentStep: 'video_upload'
    };

    res.status(500).json({
      success: false,
      message: 'Failed to create module',
      error: error.message
    });
  }
};

// Enhanced progress tracking endpoint
const getModuleCreationProgress = async (req, res) => {
  const { sessionId } = req.params;
  
  if (!global.moduleCreationProgress || !global.moduleCreationProgress[sessionId]) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: global.moduleCreationProgress[sessionId]
  });
};

// Clean up old progress data (run periodically)
const cleanupOldProgress = () => {
  if (!global.moduleCreationProgress) return;
  
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  Object.keys(global.moduleCreationProgress).forEach(sessionId => {
    const progress = global.moduleCreationProgress[sessionId];
    if (progress.timestamp && (now - progress.timestamp) > oneHour) {
      delete global.moduleCreationProgress[sessionId];
    }
  });
};

// Run cleanup every 30 minutes
setInterval(cleanupOldProgress, 30 * 60 * 1000);

module.exports = {
  createModuleWithSequentialUpload,
  getModuleCreationProgress,
  cleanupOldProgress
};
