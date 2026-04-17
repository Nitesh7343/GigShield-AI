const express = require('express');
const { createPolicy, getMyPolicy, getAllPolicies } = require('../controllers/policyController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All policy routes require authentication
router.use(authMiddleware);

router.post('/create', createPolicy);
router.get('/me', getMyPolicy);
router.get('/all', getAllPolicies);

module.exports = router;
