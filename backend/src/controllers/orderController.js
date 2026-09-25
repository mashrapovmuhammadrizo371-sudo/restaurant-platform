const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Table = require('../models/Table');
const PromoCode = require('../models/PromoCode');
const Customer = require('../models/Customer');
const PaymentCard = require('../models/PaymentCard');
const generateOrderNumber = require('../utils/orderNumber');
const notify = require('../services/notifyService');
const { ROLES } = require('../config/roles');
const { isValidUzPhone } = require('../utils/phoneValidator');

// Loyalty program: 1 point per 1000 so'm spent, minimum 1 point, awarded
// automatically once an order reaches a final completed state.
//
// NOTE: customer-facing points/leaderboard are currently disabled (no UI
// shows this), but this still runs so the underlying data keeps
// accumulating and the feature can be re-enabled later without a backfill.
const POINTS_PER_UNIT = 1000;

async function awardPointsForOrder(order) {
  if (!order.customer) return;
  const points = Math.max(1, Math.floor(order.total / POINTS_PER_UNIT));
  await Customer.findByIdAndUpdate(order.customer, {
    $inc: { points, totalOrders: 1 }
  });
}

// Recomputes item snapshots + totals server-side from live Food prices,
// so the client can never manipulate pricing.
async function buildItemsAndTotals(rawItems, brandId) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'Order must contain at least one item');
  }

  const items = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const food = await Food.findOne({ _id: raw.food, brand: brandId, isActive: true });
    if (!food) throw new ApiError(400, `Food item not found or unavailable: ${raw.food}`);
    const quantity = Number(raw.quantity) || 1;
    const lineTotal = food.price * quantity;
    subtotal += lineTotal;
    items.push({ food: food._id, name: food.name, price: food.price, quantity, lineTotal });
  }

  return { items, subtotal };
}

// POST /api/orders  (customer places an order — delivery or table)
const createOrder = asyncHandler(async (req, res) => {
  if (req.principalType !== 'customer') {
    throw new ApiError(403, 'Only customers can place orders through this endpoint');
  }

  const {
    brand, orderType, items: rawItems, paymentMethod,
    deliveryAddress, contactPhone, deliveryLatitude, deliveryLongitude, deliveryLocationAccuracy, tableId, promoCode: promoCodeStr, receiptImage
  } = req.body;

  if (!brand || !orderType || !paymentMethod) {
    throw new ApiError(400, 'brand, orderType and paymentMethod are required');
  }
  if (!['delivery', 'table'].includes(orderType)) throw new ApiError(400, 'Invalid orderType');
  if (paymentMethod === 'karta' && !receiptImage) throw new ApiError(400, 'Card transfer receipt is required');
  if (receiptImage && (paymentMethod !== 'karta' || typeof receiptImage !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(receiptImage) || receiptImage.length > 7 * 1024 * 1024)) {
    throw new ApiError(400, 'Invalid receipt image (JPEG, PNG or WebP; maximum 5 MB)');
  }
  if (orderType === 'delivery' && !deliveryAddress) {
    throw new ApiError(400, 'deliveryAddress is required for delivery orders');
  }
  if (orderType === 'delivery' && !isValidUzPhone(contactPhone)) {
    throw new ApiError(400, 'contactPhone is required for delivery orders and must be in the exact format +998 XX XXX XX XX');
  }
  if (orderType === 'table' && !tableId) {
    throw new ApiError(400, 'tableId is required for table orders');
  }

  const { items, subtotal } = await buildItemsAndTotals(rawItems, brand);

  let discount = 0;
  let promoCodeDoc = null;
  if (promoCodeStr) {
    promoCodeDoc = await PromoCode.findOne({ brand, code: String(promoCodeStr).toUpperCase() });
    if (!promoCodeDoc) throw new ApiError(404, 'Promo code not found');
    const result = promoCodeDoc.isValidForOrder(subtotal);
    if (!result.ok) throw new ApiError(400, result.reason);
    discount = promoCodeDoc.discountType === 'percent'
      ? (subtotal * promoCodeDoc.discountValue) / 100
      : promoCodeDoc.discountValue;
    if (promoCodeDoc.maxDiscount !== null) discount = Math.min(discount, promoCodeDoc.maxDiscount);
    discount = Math.min(discount, subtotal);
  }

  const total = subtotal - discount;

  let paymentCardNumber = null;
  let paymentCardHolder = null;
  if (paymentMethod === 'karta') {
    const paymentCard = await PaymentCard.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!paymentCard) throw new ApiError(400, 'Admin karta ma’lumoti kiritilmagan');
    paymentCardNumber = paymentCard.cardNumber;
    paymentCardHolder = paymentCard.cardHolder || '';
  }

  let table = null;
  if (orderType === 'table') {
    table = await Table.findOne({ _id: tableId, brand, isActive: true });
    if (!table) throw new ApiError(404, 'Table not found');
    if (table.status === 'busy') throw new ApiError(409, 'Selected table is currently busy');
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    brand,
    customer: req.customer._id,
    orderType,
    items,
    subtotal,
    discount,
    total,
    promoCode: promoCodeDoc ? promoCodeDoc._id : null,
    paymentMethod,
    paymentCardNumber,
    paymentCardHolder,
    receiptImage: receiptImage || null,
    deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
    deliveryLatitude: orderType === 'delivery' && Number.isFinite(Number(deliveryLatitude)) ? Number(deliveryLatitude) : null,
    deliveryLongitude: orderType === 'delivery' && Number.isFinite(Number(deliveryLongitude)) ? Number(deliveryLongitude) : null,
    deliveryLocationAccuracy: orderType === 'delivery' && Number.isFinite(Number(deliveryLocationAccuracy)) ? Number(deliveryLocationAccuracy) : null,
    contactPhone: orderType === 'delivery' ? contactPhone : null,
    table: orderType === 'table' ? table._id : null,
    status: 'new'
  });

  if (promoCodeDoc) {
    promoCodeDoc.usedCount += 1;
    await promoCodeDoc.save();
  }
  if (table) {
    table.status = 'busy';
    await table.save();
  }

  notify.newOrderToOperators(brand, order);

  res.status(201).json({ success: true, order });
});

// POST /api/orders/table  (ofitsiant creates an order directly for a table)
const createTableOrderByStaff = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.OFITSIANT) throw new ApiError(403, 'Only waiters can use this endpoint');

  const { brand, tableId, items: rawItems, paymentMethod, customerId } = req.body;
  if (!brand || !tableId || !paymentMethod) {
    throw new ApiError(400, 'brand, tableId and paymentMethod are required');
  }

  const table = await Table.findOne({ _id: tableId, brand, isActive: true });
  if (!table) throw new ApiError(404, 'Table not found');

  const { items, subtotal } = await buildItemsAndTotals(rawItems, brand);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    brand,
    customer: customerId || null, // walk-in orders may have no registered customer
    orderType: 'table',
    items,
    subtotal,
    discount: 0,
    total: subtotal,
    paymentMethod,
    table: table._id,
    ofitsiant: req.user._id,
    status: 'accepted' // staff-created table orders skip the cashier accept step
  });

  table.status = 'busy';
  await table.save();

  // Also let the Cashier know a waiter created a direct order, so it
  // shows up in their live order list/dashboard like every other order.
  notify.newOrderToOperators(brand, order);
  notify.tableOrderToOfitsiant(brand, order);

  res.status(201).json({ success: true, order });
});

// GET /api/orders  (staff — scoped by role)
const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.orderType) filter.orderType = req.query.orderType;

  // Optional report date. The dashboard sends a calendar date in Uzbekistan time.
  // Convert the selected local day to UTC boundaries before querying MongoDB.
  if (req.query.date) {
    const date = String(req.query.date);
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
      throw new ApiError(400, 'Invalid date. Expected YYYY-MM-DD');
    }
    const start = new Date(date + 'T00:00:00+05:00');
    const end = new Date(date + 'T00:00:00+05:00');
    end.setUTCDate(end.getUTCDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  if (req.user.role !== ROLES.BOSS) filter.brand = { $in: req.user.brands };
  if (req.user.role === ROLES.COURIER) filter.courier = req.user._id;
  if (req.user.role === ROLES.OFITSIANT) filter.ofitsiant = req.user._id;

  const orders = await Order.find(filter).select('+receiptImage')
    .populate('brand', 'name mainColor')
    .populate('customer', 'name phone')
    .populate('courier', 'name phone')
    .populate('ofitsiant', 'name')
    .populate('table', 'number')
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select('+receiptImage')
    .populate('brand', 'name mainColor')
    .populate('customer', 'name phone')
    .populate('courier', 'name phone')
    .populate('ofitsiant', 'name')
    .populate('table', 'number');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
});

// PUT /api/orders/:id/accept  (cashier / operator)
const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'new') throw new ApiError(409, 'Order already processed');

  order.status = 'accepted';
  order.operator = req.user._id;
  await order.save();

  if (order.customer) notify.orderStatusToCustomer(order.customer, order);
  res.json({ success: true, order });
});

// PUT /api/orders/:id/reject  (cashier / operator)
const rejectOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'new') throw new ApiError(409, 'Order already processed');

  order.status = 'rejected';
  order.operator = req.user._id;
  await order.save();

  if (order.table) {
    await Table.findByIdAndUpdate(order.table, { status: 'available' });
  }
  if (order.customer) notify.orderStatusToCustomer(order.customer, order);
  res.json({ success: true, order });
});

// PUT /api/orders/:id/assign-courier  (cashier / operator)  { courierId }
const assignCourier = asyncHandler(async (req, res) => {
  const { courierId } = req.body;
  if (!courierId) throw new ApiError(400, 'courierId is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderType !== 'delivery') throw new ApiError(400, 'Only delivery orders take a courier');
  if (order.status !== 'accepted') throw new ApiError(409, 'Order must be accepted before assigning a courier');

  const User = require('../models/User');
  const courier = await User.findOne({ _id: courierId, role: ROLES.COURIER, isActive: true });
  if (!courier) throw new ApiError(404, 'Courier not found');
  if (courier.courierAvailability !== 'bo_shman') {
    throw new ApiError(409, 'Selected courier is not available (Band)');
  }

  order.courier = courier._id;
  await order.save();

  notify.orderAssignedToCourier(courier._id, order);
  if (order.customer) notify.orderStatusToCustomer(order.customer, order);

  res.json({ success: true, order });
});

// PUT /api/orders/:id/assign-waiter  (cashier / operator)  { waiterId }
// Sends an accepted table order to a specific waiter, who then sees it in
// their own panel (listOrders filters by ofitsiant = that waiter) and
// clicks "Qabul qilish" (-> updateTableOrderStatus 'preparing') to confirm
// receipt back to the Cashier.
const assignWaiter = asyncHandler(async (req, res) => {
  const { waiterId } = req.body;
  if (!waiterId) throw new ApiError(400, 'waiterId is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderType !== 'table') throw new ApiError(400, 'Only table orders can be sent to a waiter');
  if (order.status !== 'accepted') throw new ApiError(409, 'Order must be accepted before sending it to a waiter');

  const User = require('../models/User');
  const waiter = await User.findOne({ _id: waiterId, role: ROLES.OFITSIANT, isActive: true });
  if (!waiter) throw new ApiError(404, 'Waiter not found');

  order.ofitsiant = waiter._id;
  await order.save();

  notify.tableOrderToOfitsiant(order.brand, order);

  res.json({ success: true, order });
});

// PUT /api/orders/:id/deliver-start  (courier)
const startDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (String(order.courier) !== String(req.user._id)) throw new ApiError(403, 'Not your order');
  if (order.status !== 'accepted') throw new ApiError(409, 'Order is not ready for delivery');

  order.status = 'delivering';
  await order.save();

  if (order.customer) notify.orderStatusToCustomer(order.customer, order);
  res.json({ success: true, order });
});

// PUT /api/orders/:id/deliver-complete  (courier)
// Note: does NOT touch courier.courierAvailability — availability stays manual.
const completeDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (String(order.courier) !== String(req.user._id)) throw new ApiError(403, 'Not your order');
  if (order.status !== 'delivering') throw new ApiError(409, 'Order is not currently out for delivery');

  order.status = 'delivered';
  order.paymentStatus = order.paymentMethod === 'naqd' ? 'paid' : order.paymentStatus;
  await order.save();
  await awardPointsForOrder(order);

  if (order.customer) notify.orderStatusToCustomer(order.customer, order);
  res.json({ success: true, order });
});

// PUT /api/orders/:id/table-status  (ofitsiant)  { status: preparing|ready|completed }
// A waiter calling this with status='preparing' on an order the Cashier
// just sent them (see assignWaiter) IS their "Qabul qilish" acceptance —
// the Cashier's own order list reflects the status change immediately, no
// separate "acknowledge" endpoint needed.
const updateTableOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['preparing', 'ready', 'completed'].includes(status)) {
    throw new ApiError(400, 'status must be preparing, ready or completed');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderType !== 'table') throw new ApiError(400, 'Not a table order');

  order.status = status;

  if (status === 'completed') {
    order.paymentStatus = order.paymentMethod === 'naqd' ? 'paid' : order.paymentStatus;
  }

  await order.save();

  if (status === 'completed' && order.table) {
    await Table.findByIdAndUpdate(order.table, { status: 'available' });
  }
  if (status === 'completed') {
    await awardPointsForOrder(order);
  }

  notify.tableOrderToOfitsiant(order.brand, order);
  if (order.customer) notify.orderStatusToCustomer(order.customer, order);

  res.json({ success: true, order });
});

// PUT /api/orders/:id/mark-paid  (cashier — confirms cash/card payment received)
const markOrderPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'paid') throw new ApiError(409, 'Order is already marked as paid');

  order.paymentStatus = 'paid';
  await order.save();

  res.json({ success: true, order });
});

module.exports = {
  createOrder,
  createTableOrderByStaff,
  listOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  assignCourier,
  assignWaiter,
  startDelivery,
  completeDelivery,
  updateTableOrderStatus,
  markOrderPaid
};
