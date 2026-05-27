const express = require('express');
const router = express.Router();
const legacyController = require('../controllers/legacyController');
const { validate, schemas } = require('../middleware/validation');

router.post('/letters', validate(schemas.createLegacyLetter), legacyController.createLegacyLetter.bind(legacyController));
router.get('/letters', legacyController.getLegacyLetters.bind(legacyController));
router.post('/executors', validate(schemas.designateExecutor), legacyController.designateExecutor.bind(legacyController));
router.get('/executors', legacyController.getExecutors.bind(legacyController));
router.post('/asset-distribution', legacyController.setAssetDistribution.bind(legacyController));
router.post('/trigger', legacyController.triggerLegacyLetters.bind(legacyController));

module.exports = router;