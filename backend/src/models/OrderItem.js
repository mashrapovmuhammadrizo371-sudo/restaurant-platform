const mongoose = require('mongoose');

// OrderItem is embedded inside Order documents (one order -> many items).
// Exported separately so it has an explicit, documented schema as requested.
const orderItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true }, // snapshot at order time
    price: { type: Number, required: true }, // snapshot at order time
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true }
  },
  { _id: false }
);

module.exports = orderItemSchema;
