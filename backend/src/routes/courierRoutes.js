const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const { listCouriers, setMyAvailability } = require('../controllers/courierController');

// Cashier now dispatches couriers too (see orderRoutes.js) — added
// additively alongside Operator, which keeps identical access.
router.get('/', authenticate(), requireRole(ROLES.OPERATOR, ROLES.CASHIER, ROLES.ADMIN), listCouriers);
router.put('/me/availability', authenticate(), requireRole(ROLES.COURIER), setMyAvailability);

module.exports = router;
