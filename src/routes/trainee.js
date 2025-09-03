const express = require('express');
const router = express.Router();
const traineeController = require('../controllers/traineeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/dashboard', traineeController.dashboard);
router.get('/modules', traineeController.listModules);
router.get('/modules/:id', traineeController.getModule);
router.post('/modules/:id/complete', traineeController.completeModule);
router.post('/modules/:id/mcq', traineeController.submitMCQ);
router.put('/modules/:id/time', traineeController.updateTimeSpent);
router.post('/help', traineeController.requestHelp);
router.post('/feedback', traineeController.submitFeedback);
router.get('/feedback/:moduleId', traineeController.getFeedback);

module.exports = router;