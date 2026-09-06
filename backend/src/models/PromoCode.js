const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent discounts
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

promoCodeSchema.index({ brand: 1, code: 1 }, { unique: true });

promoCodeSchema.methods.isValidForOrder = function isValidForOrder(orderTotal) {
  if (!this.isActive) return { ok: false, reason: 'Promo code is not active' };
  if (this.expiresAt < new Date()) return { ok: false, reason: 'Promo code has expired' };
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { ok: false, reason: 'Promo code usage limit reached' };
  }
  if (orderTotal < this.minOrder) {
    return { ok: false, reason: `Minimum order amount is ${this.minOrder}` };
  }
  return { ok: true };
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
