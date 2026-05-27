const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeVault API is running',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.get('/db', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    await db.collection('_health').doc('check').set({ timestamp: new Date() });
    res.status(200).json({
      success: true,
      message: 'Database connection OK'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;