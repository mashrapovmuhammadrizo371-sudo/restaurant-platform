const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    logo: { type: String, default: null }, // uploaded file path
    mainColor: { type: String, default: '#FF5A1F' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    telegram: { type: String, default: '' },
    instagram: { type: String, default: '' },
    description: { type: String, default: '' },
    openingHours: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
