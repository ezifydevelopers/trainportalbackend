const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const uploadLogo = require('../middlewares/uploadLogo');
const uploadVideo = require('../middlewares/uploadVideo');
const uploadResource = require('../middlewares/uploadResource');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Test endpoint
router.get('/test', adminController.testEndpoint);

router.get('/trainees', adminController.getTrainees);
router.post('/trainees', adminController.createTrainee);
router.put('/trainees/:id', adminController.updateTrainee);
router.delete('/trainees/:id', adminController.deleteTrainee);

// Manager management routes
router.get('/managers', adminController.getManagers);
router.post('/managers', adminController.createManager);
router.put('/managers/:id', adminController.updateManager);
router.delete('/managers/:id', adminController.deleteManager);
router.get('/managers/:id/companies', adminController.getManagerCompanies);
router.post('/managers/:id/assign-company', adminController.assignCompanyToManager);
router.delete('/managers/:id/unassign-company/:companyId', adminController.unassignCompanyFromManager);

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

// Time tracking routes
router.get('/time-tracking/stats', adminController.getTimeTrackingStats);

// Help request routes
router.get('/help-requests', adminController.getHelpRequests);
router.put('/help-requests/:id', adminController.updateHelpRequest);

// Feedback routes
router.get('/feedback', adminController.getAllFeedback);
router.get('/feedback/module/:moduleId', adminController.getFeedbackByModule);
router.get('/feedback/stats', adminController.getFeedbackStats);

// Resource routes
router.post('/resources', uploadResource.uploadWithErrorHandling, adminController.addResource);
router.get('/resources/module/:moduleId', adminController.getModuleResources);
router.delete('/resources/:id', adminController.deleteResource);

// Trainee management routes
router.get('/trainees', adminController.getAllTrainees);
router.put('/trainees/:id', adminController.updateTrainee);

// Notification routes
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:notificationId/read', adminController.markNotificationAsRead);
router.put('/notifications/read-all', adminController.markAllNotificationsAsRead);
router.get('/notifications/unread-count', adminController.getUnreadCount);

// Manager-specific routes
router.get('/companies/:companyId/trainees', adminController.getCompanyTrainees);
router.get('/modules/:moduleId/resources', adminController.getModuleResources);

// Certificate routes
router.post('/certificates/generate', adminController.generateCertificate);
router.get('/certificates', adminController.getAllCertificates);
router.get('/certificates/company/:companyId', adminController.getCertificatesByCompany);
router.get('/certificates/:certificateId', adminController.getCertificateById);
router.get('/certificates/:certificateId/download', adminController.downloadCertificate);
router.put('/certificates/:certificateId/revoke', adminController.revokeCertificate);

module.exports = router;