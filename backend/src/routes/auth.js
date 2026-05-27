const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');

router.post('/signup', validate(schemas.signUp), authController.signUp.bind(authController));
router.post('/signin', validate(schemas.signIn), authController.signIn.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/reset-password-request', validate(schemas.resetPassword), authController.resetPasswordRequest.bind(authController));
router.post('/logout', authController.logout.bind(authController));

module.exports = router;