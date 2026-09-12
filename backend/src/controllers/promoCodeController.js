const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const PromoCode = require('../models/PromoCode');

const listPromoCodes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  const promoCodes = await PromoCode.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, promoCodes });
});

const createPromoCode = asyncHandler(async (req, res) => {
  const { brand, code, discountType, discountValue, minOrder, maxDiscount, expiresAt, usageLimit } = req.body;
  if (!brand || !code || !discountType || discountValue === undefined || !expiresAt) {
    throw new ApiError(400, 'brand, code, discountType, discountValue and expiresAt are required');
  }
  const promoCode = await PromoCode.create({
    brand, code, discountType, discountValue, minOrder, maxDiscount, expiresAt, usageLimit
  });
  res.status(201).json({ success: true, promoCode });
});

const updatePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) throw new ApiError(404, 'Promo code not found');

  const updatable = ['code', 'discountType', 'discountValue', 'minOrder', 'maxDiscount', 'expiresAt', 'usageLimit', 'isActive'];
  for (const key of updatable) {
    if (req.body[key] !== undefined) promoCode[key] = req.body[key];
  }
  await promoCode.save();
  res.json({ success: true, promoCode });
});

const deletePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promoCode) throw new ApiError(404, 'Promo code not found');
  res.json({ success: true, message: 'Promo code deleted' });
});

// POST /api/promocodes/validate  { brand, code, orderTotal }  — used at checkout
const validatePromoCode = asyncHandler(async (req, res) => {
  const { brand, code, orderTotal } = req.body;
  if (!brand || !code || orderTotal === undefined) {
    throw new ApiError(400, 'brand, code and orderTotal are required');
  }

  const promoCode = await PromoCode.findOne({ brand, code: String(code).toUpperCase() });
  if (!promoCode) throw new ApiError(404, 'Promo code not found');

  const result = promoCode.isValidForOrder(orderTotal);
  if (!result.ok) throw new ApiError(400, result.reason);

  let discount = promoCode.discountType === 'percent'
    ? (orderTotal * promoCode.discountValue) / 100
    : promoCode.discountValue;

  if (promoCode.maxDiscount !== null) discount = Math.min(discount, promoCode.maxDiscount);
  discount = Math.min(discount, orderTotal);

  res.json({ success: true, promoCode, discount });
});

module.exports = { listPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, validatePromoCode };
