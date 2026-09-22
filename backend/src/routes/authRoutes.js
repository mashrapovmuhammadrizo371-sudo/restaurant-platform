const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  staffLogin,
  staffMe,
  customerGuest,
  customerRegister,
  customerLogin,
  customerMe
} = require('../controllers/authController');

// Shared staff login — role is auto-detected from the account.
router.post('/staff/login', staffLogin);
router.get('/staff/me', authenticate(), staffMe);

// Current customer entry point: name only, no password.
router.post('/customer/guest', customerGuest);

// Kept for future use (full phone+password account, e.g. for a future
// mobile app) — not currently linked from the frontend.
router.post('/customer/register', customerRegister);
router.post('/customer/login', customerLogin);

router.get('/customer/me', authenticate(), customerMe);

module.exports = router;
