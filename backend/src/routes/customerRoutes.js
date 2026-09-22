const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  listCustomers,
  getCustomer,
  updateCustomerStatus,
  leaderboard,
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

// Public loyalty leaderboard (top customers by points). Declared before
// '/:id' so the literal "leaderboard" path isn't swallowed by that param route.
router.get('/leaderboard', optionalAuthenticate(), leaderboard);

// Staff customer management
router.get('/', authenticate(), requirePermission('customers.manage'), listCustomers);
router.get('/:id', authenticate(), requirePermission('customers.manage'), getCustomer);
router.patch('/:id/status', authenticate(), requirePermission('customers.manage'), updateCustomerStatus);

module.exports = router;
