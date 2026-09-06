const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, PERMISSIONS } = require('../config/roles');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
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
