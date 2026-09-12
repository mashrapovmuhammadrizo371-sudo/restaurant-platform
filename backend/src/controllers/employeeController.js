const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { ROLES, isValidRole } = require('../config/roles');

// GET /api/employees?brand=<id>&role=<role>
// Boss sees everyone; Admin sees only employees within their assigned brands.
const listEmployees = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  if (req.user.role === ROLES.BOSS) {
    if (req.query.brand) filter.brands = req.query.brand;
  } else {
    filter.brands = { $in: req.user.brands };
  }

  const employees = await User.find(filter).sort({ name: 1 });
  res.json({ success: true, employees: employees.map(e => e.toSafeJSON()) });
});

// POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const { name, phone, login, password, role, brands, permissions } = req.body;
  if (!name || !login || !password || !role) {
    throw new ApiError(400, 'name, login, password and role are required');
  }
  if (!isValidRole(role)) throw new ApiError(400, 'Invalid role');
  if (role === ROLES.BOSS && req.user.role !== ROLES.BOSS) {
    throw new ApiError(403, 'Only Boss can create another Boss account');
  }

  const existing = await User.findOne({ login: String(login).toLowerCase() });
  if (existing) throw new ApiError(409, 'This login is already taken');

  // Non-boss admins may only assign employees to brands they themselves manage.
  let assignedBrands = brands || [];
  if (req.user.role !== ROLES.BOSS) {
    assignedBrands = assignedBrands.filter(b => req.user.brands.map(String).includes(String(b)));
  }

  const passwordHash = await User.hashPassword(password);
  const employee = await User.create({
    name,
    phone,
    login: String(login).toLowerCase(),
    passwordHash,
    role,
    brands: assignedBrands,
    permissions: role === ROLES.ADMIN ? (permissions || []) : []
  });

  res.status(201).json({ success: true, employee: employee.toSafeJSON() });
});

// PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  if (req.user.role !== ROLES.BOSS) {
    const sharesbrand = employee.brands.some(b => req.user.brands.map(String).includes(String(b)));
    if (!sharesbrand) throw new ApiError(403, 'No access to this employee');
  }

  for (const key of ['name', 'phone', 'brands', 'permissions', 'isActive']) {
    if (req.body[key] !== undefined) employee[key] = req.body[key];
  }
  await employee.save();
  res.json({ success: true, employee: employee.toSafeJSON() });
});

// PUT /api/employees/:id/password  — admin/boss resets a password (never views existing one)
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'newPassword must be at least 6 characters');
  }

  const employee = await User.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.passwordHash = await User.hashPassword(newPassword);
  await employee.save();
  res.json({ success: true, message: 'Password reset successfully' });
});

// DELETE /api/employees/:id
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findByIdAndDelete(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, message: 'Employee deleted' });
});

module.exports = { listEmployees, createEmployee, updateEmployee, resetPassword, deleteEmployee };
