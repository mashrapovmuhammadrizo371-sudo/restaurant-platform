const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

foodSchema.index({ brand: 1, category: 1 });

module.exports = mongoose.model('Food', foodSchema);
