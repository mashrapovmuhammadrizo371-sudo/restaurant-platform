const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const {
  createOrder,
  createTableOrderByStaff,
  listOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  assignCourier,
  startDelivery,
  completeDelivery,
  updateTableOrderStatus
} = require('../controllers/orderController');

// Customer places an order (delivery or table)
router.post('/', authenticate(), createOrder);

// Waiter creates a table order directly
router.post('/table', authenticate(), requireRole(ROLES.OFITSIANT), createTableOrderByStaff);

// Staff — listing & detail (scoped by role inside the controller)
router.get(
  '/',
  authenticate(),
  requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.COURIER, ROLES.OFITSIANT),
  listOrders
);
router.get(
  '/:id',
  authenticate(),
  requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.COURIER, ROLES.OFITSIANT),
  getOrder
);

// Operator actions
router.put('/:id/accept', authenticate(), requireRole(ROLES.OPERATOR), acceptOrder);
router.put('/:id/reject', authenticate(), requireRole(ROLES.OPERATOR), rejectOrder);
router.put('/:id/assign-courier', authenticate(), requireRole(ROLES.OPERATOR), assignCourier);

// Courier actions
router.put('/:id/deliver-start', authenticate(), requireRole(ROLES.COURIER), startDelivery);
router.put('/:id/deliver-complete', authenticate(), requireRole(ROLES.COURIER), completeDelivery);

// Ofitsiant actions
router.put('/:id/table-status', authenticate(), requireRole(ROLES.OFITSIANT), updateTableOrderStatus);

module.exports = router;
