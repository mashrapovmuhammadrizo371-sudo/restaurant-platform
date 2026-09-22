const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const { listWaiters } = require('../controllers/courierController');

router.get('/', authenticate(), requireRole(ROLES.CASHIER, ROLES.OPERATOR, ROLES.ADMIN), listWaiters);

module.exports = router;
