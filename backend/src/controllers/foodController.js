const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Food = require('../models/Food');
const { filePublicUrl } = require('../middleware/upload');

// GET /api/foods?brand=<id>&category=<id>&search=<text>
const listFoods = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  if (req.principalType !== 'staff') filter.isActive = true;

  const foods = await Food.find(filter).populate('category', 'name').sort({ name: 1 });
  res.json({ success: true, foods });
});

const getFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id).populate('category', 'name');
  if (!food) throw new ApiError(404, 'Food not found');
  res.json({ success: true, food });
});

const createFood = asyncHandler(async (req, res) => {
  const { brand, category, name, description, ingredients, price } = req.body;
  if (!brand || !category || !name || price === undefined) {
    throw new ApiError(400, 'brand, category, name and price are required');
  }
  const food = await Food.create({
    brand,
    category,
    name,
    description,
    ingredients,
    price,
    image: req.file ? filePublicUrl(req.file.filename) : null
  });
  res.status(201).json({ success: true, food });
});

const updateFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) throw new ApiError(404, 'Food not found');

  const updatable = ['category', 'name', 'description', 'ingredients', 'price', 'isActive'];
  for (const key of updatable) {
    if (req.body[key] !== undefined) food[key] = req.body[key];
  }
  if (req.file) food.image = filePublicUrl(req.file.filename);

  await food.save();
  res.json({ success: true, food });
});

const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw new ApiError(404, 'Food not found');
  res.json({ success: true, message: 'Food deleted' });
});

module.exports = { listFoods, getFood, createFood, updateFood, deleteFood };
