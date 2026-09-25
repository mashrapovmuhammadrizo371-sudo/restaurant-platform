const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const PaymentCard = require('../models/PaymentCard');

function normalizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 19);
}

const getPublicCard = asyncHandler(async (req, res) => {
  const card = await PaymentCard.findOne({ isActive: true }).sort({ updatedAt: -1 });
  res.json({
    success: true,
    card: card
      ? { cardNumber: card.cardNumber, cardHolder: card.cardHolder }
      : null
  });
});

const getAdminCard = asyncHandler(async (req, res) => {
  const card = await PaymentCard.findOne().sort({ updatedAt: -1 });
  res.json({ success: true, card });
});

const saveAdminCard = asyncHandler(async (req, res) => {
  const cardNumber = normalizeCardNumber(req.body.cardNumber);
  const cardHolder = String(req.body.cardHolder || '').trim();

  if (cardNumber.length < 12) {
    throw new ApiError(400, 'Karta raqami noto‘g‘ri');
  }

  let card = await PaymentCard.findOne().sort({ updatedAt: -1 });
  if (!card) {
    card = new PaymentCard();
  }

  card.cardNumber = cardNumber;
  card.cardHolder = cardHolder;
  card.isActive = true;
  await card.save();

  res.json({ success: true, card });
});

module.exports = { getPublicCard, getAdminCard, saveAdminCard };
