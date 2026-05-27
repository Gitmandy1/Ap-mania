const { db } = require('../config/firebase');
const logger = require('../utils/logger');
const auditService = require('../utils/audit');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

class LegacyController {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  async createLegacyLetter(req, res, next) {
    try {
      const userId = req.user.uid;
      const {
        recipientEmail,
        recipientName,
        subject,
        letterContent,
        relationship,
        autoSendOnDeath
      } = req.body;

      const letterId = uuidv4();

      const legacyLetter = {
        userId,
        letterId,
        recipientEmail,
        recipientName,
        subject,
        letterContent,
        relationship,
        autoSendOnDeath: autoSendOnDeath || true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        sentAt: null,
        deliveredAt: null
      };

      await db.collection('legacyLetters').doc(letterId).set(legacyLetter);

      await auditService.logAction(
        userId,
        'CREATE',
        'legacy.letter',
        letterId,
        {
          recipientEmail,
          autoSendOnDeath
        }
      );

      logger.info(`Legacy letter created for user ${userId} to ${recipientEmail}`);

      return res.status(201).json({
        success: true,
        message: 'Legacy letter created',
        data: {
          letterId,
          recipientEmail,
          recipientName,
          status: 'pending',
          createdAt: legacyLetter.createdAt
        }
      });
    } catch (error) {
      logger.error('Create legacy letter error:', error);
      next(error);
    }
  }

  async getLegacyLetters(req, res, next) {
    try {
      const userId = req.user.uid;

      const snapshot = await db.collection('legacyLetters')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const letters = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          letterId: data.letterId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          subject: data.subject,
          status: data.status,
          autoSendOnDeath: data.autoSendOnDeath,
          createdAt: data.createdAt?.toDate?.(),
          sentAt: data.sentAt?.toDate?.()
        };
      });

      await auditService.logAction(
        userId,
        'READ',
        'legacy.letters',
        userId
      );

      return res.status(200).json({
        success: true,
        message: 'Legacy letters retrieved',
        data: letters
      });
    } catch (error) {
      logger.error('Get legacy letters error:', error);
      next(error);
    }
  }

  async designateExecutor(req, res, next) {
    try {
      const userId = req.user.uid;
      const {
        executorEmail,
        executorName,
        accessLevel,
        customPermissions
      } = req.body;

      const executorId = uuidv4();

      const executor = {
        userId,
        executorId,
        executorEmail,
        executorName,
        accessLevel,
        customPermissions: customPermissions || [],
        status: 'pending',
        isActivated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        acceptedAt: null
      };

      await db.collection('executors').doc(executorId).set(executor);

      await this.sendExecutorInvitation(executorEmail, executorName, userId);

      await auditService.logAction(
        userId,
        'CREATE',
        'legacy.executor',
        executorId,
        { executorEmail, accessLevel }
      );

      logger.info(`Executor designated for user ${userId}: ${executorEmail}`);

      return res.status(201).json({
        success: true,
        message: 'Executor designated and invitation sent',
        data: {
          executorId,
          executorEmail,
          executorName,
          accessLevel,
          status: 'pending'
        }
      });
    } catch (error) {
      logger.error('Designate executor error:', error);
      next(error);
    }
  }

  async getExecutors(req, res, next) {
    try {
      const userId = req.user.uid;

      const snapshot = await db.collection('executors')
        .where('userId', '==', userId)
        .get();

      const executors = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          executorId: data.executorId,
          executorEmail: data.executorEmail,
          executorName: data.executorName,
          accessLevel: data.accessLevel,
          status: data.status,
          isActivated: data.isActivated,
          createdAt: data.createdAt?.toDate?.()
        };
      });

      return res.status(200).json({
        success: true,
        message: 'Executors retrieved',
        data: executors
      });
    } catch (error) {
      logger.error('Get executors error:', error);
      next(error);
    }
  }

  async setAssetDistribution(req, res, next) {
    try {
      const userId = req.user.uid;
      const { assets } = req.body;

      const distributionId = uuidv4();

      const distribution = {
        userId,
        distributionId,
        assets: assets || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('assetDistribution').doc(distributionId).set(distribution);

      await auditService.logAction(
        userId,
        'CREATE',
        'legacy.assetDistribution',
        distributionId,
        { assetCount: assets?.length || 0 }
      );

      logger.info(`Asset distribution set for user ${userId}`);

      return res.status(201).json({
        success: true,
        message: 'Asset distribution configured',
        data: {
          distributionId,
          assetCount: assets?.length || 0,
          createdAt: distribution.createdAt
        }
      });
    } catch (error) {
      logger.error('Set asset distribution error:', error);
      next(error);
    }
  }

  async sendExecutorInvitation(executorEmail, executorName, userId) {
    try {
      const emailContent = `
        <h2>You've been designated as an executor</h2>
        <p>Hi ${executorName},</p>
        <p>You have been designated as an executor for a LifeVault account.</p>
        <p>You will have access to important documents, instructions, and letters when needed.</p>
        <p><a href="${process.env.API_URL}/legacy/accept-executor">Accept Executor Role</a></p>
      `;

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: executorEmail,
        subject: 'You\'ve been designated as an executor',
        html: emailContent
      });

      logger.info(`Executor invitation sent to ${executorEmail}`);
    } catch (error) {
      logger.error('Failed to send executor invitation:', error);
    }
  }

  async triggerLegacyLetters(req, res, next) {
    try {
      const { userId } = req.body;

      const snapshot = await db.collection('legacyLetters')
        .where('userId', '==', userId)
        .where('autoSendOnDeath', '==', true)
        .where('status', '==', 'pending')
        .get();

      let sentCount = 0;

      for (const doc of snapshot.docs) {
        const letter = doc.data();
        try {
          await this.sendLegacyLetter(letter);
          await doc.ref.update({ status: 'sent', sentAt: new Date() });
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send legacy letter ${doc.id}:`, error);
        }
      }

      logger.info(`Legacy letters triggered for user ${userId}: ${sentCount} sent`);

      return res.status(200).json({
        success: true,
        message: `Legacy letters sent: ${sentCount}`,
        data: { sentCount }
      });
    } catch (error) {
      logger.error('Trigger legacy letters error:', error);
      next(error);
    }
  }

  async sendLegacyLetter(letter) {
    const emailContent = `
      <h2>${letter.subject}</h2>
      <p>Dear ${letter.recipientName},</p>
      <div>${letter.letterContent}</div>
      <p style="color: #999; font-size: 12px;">This letter was sent from LifeVault.</p>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: letter.recipientEmail,
      subject: letter.subject,
      html: emailContent
    });

    logger.info(`Legacy letter sent to ${letter.recipientEmail}`);
  }
}

module.exports = new LegacyController();