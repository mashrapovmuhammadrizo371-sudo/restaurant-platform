const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isValidUzPhone } = require('../utils/phoneValidator');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    address: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Optional: customers can now enter the site with just a name (see
    // authController.customerGuest) and add a phone number later (e.g. at
    // checkout for delivery contact, or if they later register a full
    // account — see customerRegister/customerLogin, kept for future use).
    // `sparse: true` lets many customers share an absent phone without
    // violating the uniqueness constraint on customers that do have one.
    // Stored and matched EXACTLY as "+998 XX XXX XX XX" when present — no
    // other shape is accepted, and nothing here rewrites/normalizes input
    // into this format. See backend/src/utils/phoneValidator.js.
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      validate: {
        validator: v => v === undefined || v === null || isValidUzPhone(v),
        message: () => 'Phone number must be in the exact format +998 XX XXX XX XX'
      }
    },
    // Set only for customers created via the full register/login flow.
    // Guest (name-only) customers get a random unusable password hash —
    // there is no password-based login path for them.
    passwordHash: { type: String, required: true, select: false },
    addresses: [addressSchema],
    // Loyalty program: incremented automatically when one of the customer's
    // orders reaches a final completed state (delivered / completed).
    // Powers the customer ratings/leaderboard feature.
    points: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

customerSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

customerSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model('Customer', customerSchema);
