const express = require('express');
const { getUserClaims } = require('../services/claimProcessingService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/claims/my
 * Get all claims for authenticated user
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const claims = await getUserClaims(req.userId);
    res.status(200).json({ claims });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
});

module.exports = router;
