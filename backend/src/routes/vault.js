const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { validate, schemas } = require('../middleware/validation');

router.get('/:familyMemberId/items', vaultController.getVaultItems.bind(vaultController));
router.post('/family-members', validate(schemas.createFamilyMember), vaultController.addFamilyMember.bind(vaultController));
router.post('/documents', validate(schemas.updateVaultItem), vaultController.uploadDocument.bind(vaultController));
router.post('/sensitive-data', vaultController.storeSensitiveData.bind(vaultController));
router.get('/sensitive-data/:familyMemberId/:dataType', vaultController.getSensitiveData.bind(vaultController));

module.exports = router;