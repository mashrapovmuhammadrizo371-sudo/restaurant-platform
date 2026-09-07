const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Brand = require('../models/Brand');
const { filePublicUrl } = require('../middleware/upload');
const { ROLES } = require('../config/roles');

// GET /api/brands  (public: only active brands; staff: all, scoped by role)
const listBrands = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.principalType === 'staff' && req.user.role !== ROLES.BOSS) {
    filter._id = { $in: req.user.brands };
  } else if (req.principalType !== 'staff') {
    filter.isActive = true; // public/customer view
  }

  const brands = await Brand.find(filter).sort({ name: 1 });
  res.json({ success: true, brands });
});

// GET /api/brands/:id
const getBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  res.json({ success: true, brand });
});

// POST /api/brands  (boss only)
const createBrand = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) body.logo = filePublicUrl(req.file.filename);

  const brand = await Brand.create(body);
  res.status(201).json({ success: true, brand });
});

// PUT /api/brands/:id  (boss, or admin with brand access + brands.manage permission)
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  const updatable = [
    'name', 'slug', 'mainColor', 'phone', 'address',
    'telegram', 'instagram', 'description', 'openingHours', 'isActive'
  ];
  for (const key of updatable) {
    if (req.body[key] !== undefined) brand[key] = req.body[key];
  }
  if (req.file) brand.logo = filePublicUrl(req.file.filename);

  await brand.save();
  res.json({ success: true, brand });
});

// DELETE /api/brands/:id  (boss only)
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  res.json({ success: true, message: 'Brand deleted' });
});

module.exports = { listBrands, getBrand, createBrand, updateBrand, deleteBrand };
