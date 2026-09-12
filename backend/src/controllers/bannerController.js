const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Banner = require('../models/Banner');
const { filePublicUrl } = require('../middleware/upload');

const listBanners = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.principalType !== 'staff') filter.isActive = true;

  const banners = await Banner.find(filter).sort({ order: 1 });
  res.json({ success: true, banners });
});

const createBanner = asyncHandler(async (req, res) => {
  const { brand, title, description, order } = req.body;
  if (!brand) throw new ApiError(400, 'brand is required');
  if (!req.file) throw new ApiError(400, 'Banner image is required');

  const banner = await Banner.create({
    brand,
    title,
    description,
    order,
    image: filePublicUrl(req.file.filename)
  });
  res.status(201).json({ success: true, banner });
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');

  for (const key of ['title', 'description', 'order', 'isActive']) {
    if (req.body[key] !== undefined) banner[key] = req.body[key];
  }
  if (req.file) banner.image = filePublicUrl(req.file.filename);

  await banner.save();
  res.json({ success: true, banner });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json({ success: true, message: 'Banner deleted' });
});

module.exports = { listBanners, createBanner, updateBanner, deleteBanner };
