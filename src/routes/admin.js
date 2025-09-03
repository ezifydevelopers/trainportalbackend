const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const uploadLogo = require('../middlewares/uploadLogo');
const uploadVideo = require('../middlewares/uploadVideo');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Test endpoint
router.get('/test', adminController.testEndpoint);

router.get('/trainees', adminController.getTrainees);
router.post('/trainees', adminController.createTrainee);
router.put('/trainees/:id', adminController.updateTrainee);
router.delete('/trainees/:id', adminController.deleteTrainee);

router.get('/companies', adminController.getCompanies);
router.post('/companies', uploadLogo.single('logo'), adminController.createCompany);
router.put('/companies/:id', uploadLogo.single('logo'), adminController.updateCompany);
router.delete('/companies/:id', adminController.deleteCompany);

router.get('/modules', adminController.getAllModules);
router.post('/companies/:id/modules', adminController.addModule);
router.put('/modules/reorder', adminController.reorderModules);
router.put('/modules/:id', adminController.updateModule);
router.delete('/modules/:id', adminController.deleteModule);
router.post('/modules/:id/video', uploadVideo.single('video'), adminController.addVideo);
router.post('/modules/:id/mcqs', adminController.addMCQs);

router.get('/trainees/:id/progress', adminController.getTraineeProgress);
router.post('/trainees/assign-modules', adminController.assignTraineeToModules);
router.post('/trainees/:traineeId/assign-company-modules', adminController.assignTraineeToCompanyModules);
router.get('/users', adminController.getAllUsers);

// Help request routes
router.get('/help-requests', adminController.getHelpRequests);
router.put('/help-requests/:id', adminController.updateHelpRequest);

// Feedback routes
router.get('/feedback', adminController.getAllFeedback);
router.get('/feedback/module/:moduleId', adminController.getFeedbackByModule);
router.get('/feedback/stats', adminController.getFeedbackStats);

module.exports = router;