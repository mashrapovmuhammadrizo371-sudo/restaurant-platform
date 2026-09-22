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
  assignWaiter,
  startDelivery,
  completeDelivery,
  updateTableOrderStatus,
  markOrderPaid
} = require('../controllers/orderController');

// Customer places an order (delivery or table)
router.post('/', authenticate(), createOrder);

// Waiter creates a table order directly
router.post('/table', authenticate(), requireRole(ROLES.OFITSIANT), createTableOrderByStaff);

// Staff — listing & detail (scoped by role inside the controller)
router.get(
  '/',
  authenticate(),
  requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.COURIER, ROLES.OFITSIANT, ROLES.CASHIER),
  listOrders
);
router.get(
  '/:id',
  authenticate(),
  requireRole(ROLES.ADMIN, ROLES.OPERATOR, ROLES.COURIER, ROLES.OFITSIANT, ROLES.CASHIER),
  getOrder
);

// Order dispatch (accept/reject a new order, assign a courier to a
// delivery order, or send an accepted table order to a specific waiter).
// Historically Operator-only; the current staff-role spec routes new
// orders through Kassir (Cashier) instead. Cashier is granted here
// ADDITIVELY — Operator keeps the same access and its panel
// (OperatorPage.jsx) is unchanged, so nothing that worked before stops
// working; a deployment that still uses Operator accounts is unaffected.
router.put('/:id/accept', authenticate(), requireRole(ROLES.OPERATOR, ROLES.CASHIER), acceptOrder);
router.put('/:id/reject', authenticate(), requireRole(ROLES.OPERATOR, ROLES.CASHIER), rejectOrder);
router.put('/:id/assign-courier', authenticate(), requireRole(ROLES.OPERATOR, ROLES.CASHIER), assignCourier);
router.put('/:id/assign-waiter', authenticate(), requireRole(ROLES.OPERATOR, ROLES.CASHIER), assignWaiter);

// Courier actions
router.put('/:id/deliver-start', authenticate(), requireRole(ROLES.COURIER), startDelivery);
router.put('/:id/deliver-complete', authenticate(), requireRole(ROLES.COURIER), completeDelivery);

// Ofitsiant actions
router.put('/:id/table-status', authenticate(), requireRole(ROLES.OFITSIANT), updateTableOrderStatus);

// Cashier actions
router.put('/:id/mark-paid', authenticate(), requireRole(ROLES.CASHIER), markOrderPaid);

module.exports = router;
