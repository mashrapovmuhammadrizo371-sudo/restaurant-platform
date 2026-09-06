const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

bannerSchema.index({ brand: 1, order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
