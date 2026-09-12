const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  listEmployees,
  createEmployee,
  updateEmployee,
  resetPassword,
  deleteEmployee
} = require('../controllers/employeeController');

router.use(authenticate(), requirePermission('employees.manage'));

router.get('/', listEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.put('/:id/password', resetPassword);
router.delete('/:id', deleteEmployee);

module.exports = router;
