const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Table = require('../models/Table');

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

module.exports = { listTables, createTable, updateTable, deleteTable };
