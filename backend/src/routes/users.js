const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const logger = require('../utils/logger');

router.get('/profile', async (req, res, next) => {
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
      message: 'Profile retrieved',
      data: {
        uid: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        subscriptionStatus: userData.subscriptionStatus,
        createdAt: userData.createdAt?.toDate?.()
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { firstName, lastName, phoneNumber, profilePicture } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePicture) updateData.profilePicture = profilePicture;

    await db.collection('users').doc(userId).update(updateData);

    logger.info(`User profile updated: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: updateData
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
});

module.exports = router;