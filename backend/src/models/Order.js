const mongoose = require('mongoose');
const orderItemSchema = require('./OrderItem');

const DELIVERY_STATUSES = ['accepted', 'delivering', 'delivered', 'rejected'];
const TABLE_STATUSES = ['accepted', 'preparing', 'ready', 'completed', 'rejected'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

    orderType: { type: String, enum: ['delivery', 'table'], required: true },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    promoCode: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },

    paymentMethod: { type: String, enum: ['naqd', 'karta', 'online'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

    // delivery-specific
    deliveryAddress: { type: String, default: null },

    // table-specific
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },

    // staff involved
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ofitsiant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    status: {
      type: String,
      enum: [...new Set([...DELIVERY_STATUSES, ...TABLE_STATUSES, 'new'])],
      default: 'new'
    }
  },
  { timestamps: true }
);

orderSchema.index({ brand: 1, status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ courier: 1, status: 1 });

orderSchema.statics.DELIVERY_STATUSES = DELIVERY_STATUSES;
orderSchema.statics.TABLE_STATUSES = TABLE_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
