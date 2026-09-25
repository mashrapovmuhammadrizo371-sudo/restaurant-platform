const mongoose = require('mongoose');
const orderItemSchema = require('./OrderItem');
const { isValidUzPhone } = require('../utils/phoneValidator');

const DELIVERY_STATUSES = ['accepted', 'delivering', 'delivered', 'rejected'];
const TABLE_STATUSES = ['accepted', 'preparing', 'ready', 'completed', 'rejected'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    // Not required: a waiter can create a walk-in table order for a guest
    // with no registered customer account (see createTableOrderByStaff).
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },

    orderType: { type: String, enum: ['delivery', 'table'], required: true },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    promoCode: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },

    paymentMethod: { type: String, enum: ['naqd', 'karta', 'online'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    // Snapshot of the card that the customer was instructed to pay to.
    // Kept on the order so later card changes do not alter payment history.
    paymentCardNumber: { type: String, default: null },
    paymentCardHolder: { type: String, default: null },
    // Customer-submitted transfer receipt image (base64 data URL).
    receiptImage: { type: String, default: null, select: false },

    // delivery-specific
    deliveryAddress: { type: String, default: null },
    // Exact device GPS snapshot for delivery orders. The accuracy value is supplied by the browser in meters.
    deliveryLatitude: { type: Number, default: null },
    deliveryLongitude: { type: Number, default: null },
    deliveryLocationAccuracy: { type: Number, default: null },
    // Contact number for the courier to reach the customer. Collected at
    // checkout regardless of whether the customer has a phone on their
    // account (customers can now enter with just a name — see
    // authController.customerGuest — so the account itself may have no
    // phone at all). Required for delivery orders; always exactly
    // "+998 XX XXX XX XX".
    contactPhone: {
      type: String,
      default: null,
      validate: {
        validator: function validateContactPhone(v) {
          if (this.orderType !== 'delivery') return true;
          return isValidUzPhone(v);
        },
        message: () => 'contactPhone must be in the exact format +998 XX XXX XX XX'
      }
    },

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
