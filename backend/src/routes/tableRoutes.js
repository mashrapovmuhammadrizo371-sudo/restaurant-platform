const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  setTableStatus
} = require('../controllers/tableController');

router.get('/', optionalAuthenticate(), listTables);

router.post(
  '/',
  authenticate(),
  requirePermission('tables.manage'),
  requireBrandAccess(),
  createTable
);
router.put('/:id', authenticate(), requirePermission('tables.manage'), updateTable);
router.delete('/:id', authenticate(), requirePermission('tables.manage'), deleteTable);

// Waiter-only: mark a table busy/free. See tableController.setTableStatus
// for why this can't just reuse the updateTable route above.
router.put('/:id/status', authenticate(), requireRole(ROLES.OFITSIANT), setTableStatus);

module.exports = router;
