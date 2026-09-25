const mongoose = require('mongoose');

const paymentCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, trim: true },
    cardHolder: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentCard', paymentCardSchema);
