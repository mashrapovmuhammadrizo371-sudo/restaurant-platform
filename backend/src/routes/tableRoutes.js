const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess } = require('../middleware/rbac');
const {
  listTables,
  createTable,
  updateTable,
  deleteTable
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

module.exports = router;
