const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.index({ brand: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
