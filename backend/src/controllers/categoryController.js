const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');

// GET /api/categories?brand=<id>
const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.principalType !== 'staff') filter.isActive = true;

  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  res.json({ success: true, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { brand, name, order } = req.body;
  if (!brand || !name) throw new ApiError(400, 'brand and name are required');
  const category = await Category.create({ brand, name, order });
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  for (const key of ['name', 'order', 'isActive']) {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  }
  await category.save();
  res.json({ success: true, category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
