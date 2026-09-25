const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const {
  getPublicCard,
  getAdminCard,
  saveAdminCard
} = require('../controllers/paymentCardController');

router.get('/public', getPublicCard);
router.get('/', authenticate(), requireRole(ROLES.BOSS), getAdminCard);
router.put('/', authenticate(), requireRole(ROLES.BOSS), saveAdminCard);

module.exports = router;
