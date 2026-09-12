const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess } = require('../middleware/rbac');
const {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode
} = require('../controllers/promoCodeController');

router.post('/validate', optionalAuthenticate(), validatePromoCode);

router.get('/', authenticate(), requirePermission('promocodes.manage'), listPromoCodes);
router.post(
  '/',
  authenticate(),
  requirePermission('promocodes.manage'),
  requireBrandAccess(),
  createPromoCode
);
router.put('/:id', authenticate(), requirePermission('promocodes.manage'), updatePromoCode);
router.delete('/:id', authenticate(), requirePermission('promocodes.manage'), deletePromoCode);

module.exports = router;
