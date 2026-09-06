const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    number: { type: Number, required: true },
    status: { type: String, enum: ['available', 'busy'], default: 'available' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

tableSchema.index({ brand: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
