const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const logger = require('../utils/logger');
const auditService = require('../utils/audit');

router.get('/status', async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      message: 'Subscription status retrieved',
      data: {
        status: userData.subscriptionStatus,
        expiry: userData.subscriptionExpiry?.toDate?.(),
        plan: userData.subscriptionStatus === 'premium' ? 'premium' : 'free'
      }
    });
  } catch (error) {
    logger.error('Get subscription status error:', error);
    next(error);
  }
});

router.post('/upgrade', async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { planType, paymentToken } = req.body;

    const expiryDate = new Date();
    if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (planType === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'premium',
      subscriptionExpiry: expiryDate,
      updatedAt: new Date()
    });

    await auditService.logAction(
      userId,
      'UPGRADE',
      'subscription.plan',
      userId,
      { planType }
    );

    logger.info(`User upgraded to premium: ${userId} (${planType})`);

    return res.status(200).json({
      success: true,
      message: 'Subscription upgraded',
      data: {
        status: 'premium',
        planType,
        expiryDate
      }
    });
  } catch (error) {
    logger.error('Upgrade subscription error:', error);
    next(error);
  }
});

router.post('/cancel', async (req, res, next) => {
  try {
    const userId = req.user.uid;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'free',
      subscriptionExpiry: null,
      updatedAt: new Date()
    });

    await auditService.logAction(
      userId,
      'CANCEL',
      'subscription.plan',
      userId
    );

    logger.info(`Subscription cancelled: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled',
      data: {
        status: 'free'
      }
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    next(error);
  }
});

module.exports = router;