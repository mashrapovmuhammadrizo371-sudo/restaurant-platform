const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Table = require('../models/Table');
const { ROLES } = require('../config/roles');

// GET /api/tables?brand=<id>
const listTables = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.principalType !== 'staff') filter.isActive = true;

  const tables = await Table.find(filter).sort({ number: 1 });
  res.json({ success: true, tables });
});

const createTable = asyncHandler(async (req, res) => {
  const { brand, number } = req.body;
  if (!brand || number === undefined) throw new ApiError(400, 'brand and number are required');
  const table = await Table.create({ brand, number });
  res.status(201).json({ success: true, table });
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  for (const key of ['number', 'status', 'isActive']) {
    if (req.body[key] !== undefined) table[key] = req.body[key];
  }
  await table.save();
  res.json({ success: true, table });
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ success: true, message: 'Table deleted' });
});

// PUT /api/tables/:id/status  { status: 'available' | 'busy' }  (ofitsiant)
// Narrow, waiter-facing alternative to updateTable: only ever touches
// `status`, and only for a table in the waiter's own assigned brand(s).
// Waiters can't reach updateTable at all (it requires the admin
// 'tables.manage' permission, which is fixed-role-excluded for ofitsiant
// — see rbac.requirePermission), so without this endpoint a waiter has no
// way to actually mark a table Band/Bo'sh despite that being their job
// per the product spec.
const setTableStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.OFITSIANT) throw new ApiError(403, 'Only waiters can use this endpoint');

  const { status } = req.body;
  if (!['available', 'busy'].includes(status)) {
    throw new ApiError(400, "status must be 'available' or 'busy'");
  }

  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  if (!req.user.brands.map(String).includes(String(table.brand))) {
    throw new ApiError(403, 'No access to this brand');
  }

  table.status = status;
  await table.save();

  res.json({ success: true, table });
});

module.exports = { listTables, createTable, updateTable, deleteTable, setTableStatus };
