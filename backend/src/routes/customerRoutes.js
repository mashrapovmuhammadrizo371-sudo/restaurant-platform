const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  listCustomers,
  getCustomer,
  updateMyProfile,
  addMyAddress,
  deleteMyAddress,
  myOrders
} = require('../controllers/customerController');

// Customer's own profile (customer-authenticated)
router.put('/me', authenticate(), updateMyProfile);
router.post('/me/addresses', authenticate(), addMyAddress);
router.delete('/me/addresses/:addressId', authenticate(), deleteMyAddress);
router.get('/me/orders', authenticate(), myOrders);

// Staff customer management
router.get('/', authenticate(), requirePermission('customers.manage'), listCustomers);
router.get('/:id', authenticate(), requirePermission('customers.manage'), getCustomer);

module.exports = router;
