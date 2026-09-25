const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const { chatWithAdminAi } = require('../controllers/adminAiController');

// Only authenticated Boss/Admin accounts can use the admin AI assistant.
router.post('/chat', authenticate(), requireRole(ROLES.BOSS, ROLES.ADMIN), chatWithAdminAi);

module.exports = router;
