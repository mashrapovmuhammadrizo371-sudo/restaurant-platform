const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, PERMISSIONS } = require('../config/roles');
const { isValidUzPhone } = require('../utils/phoneValidator');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Optional (login/password is the real credential, not phone), but
    // when provided must be the exact "+998 XX XXX XX XX" format — no
    // normalization, same rule as Customer.phone. See
    // backend/src/utils/phoneValidator.js.
    phone: {
      type: String,
      validate: {
        validator: v => v === undefined || v === null || v === '' || isValidUzPhone(v),
        message: () => 'Phone number must be in the exact format +998 XX XXX XX XX'
      }
    },
    login: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true
    },
    // Brands this user may operate on. Boss ignores this (full access).
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    // Only meaningful for role = admin. Boss has all permissions implicitly.
    permissions: [{ type: String, enum: PERMISSIONS }],
    // Only meaningful for role = courier
    courierAvailability: {
      type: String,
      enum: ['bo_shman', 'bandman'], // "I'm free" / "I'm busy"
      default: 'bandman'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
