const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  staffLogin,
  staffMe,
  customerRegister,
  customerLogin,
  customerMe
} = require('../controllers/authController');

// Shared staff login — role is auto-detected from the account.
router.post('/staff/login', staffLogin);
router.get('/staff/me', authenticate(), staffMe);

router.post('/customer/register', customerRegister);
router.post('/customer/login', customerLogin);
router.get('/customer/me', authenticate(), customerMe);

module.exports = router;
