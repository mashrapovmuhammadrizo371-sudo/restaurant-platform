const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { isValidUzPhone } = require('../utils/phoneValidator');

// GET /api/customers  (staff only — admin/boss customer management)
const listCustomers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { surname: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  const ids = customers.map(c => c._id);
  const stats = await Order.aggregate([
    { $match: { customer: { $in: ids } } },
    { $group: { _id: '$customer', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } }
  ]);
  const byId = new Map(stats.map(s => [String(s._id), s]));
  const enriched = customers.map(c => {
    const s = byId.get(String(c._id)) || {};
    return { ...c, totalOrders: s.totalOrders || 0, totalSpent: s.totalSpent || 0, lastOrderAt: s.lastOrderAt || null };
  });
  res.json({ success: true, customers: enriched });
});

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, customer });
});



// PATCH /api/customers/:id/status — staff customer management
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  if (typeof req.body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be boolean');
  customer.isActive = req.body.isActive;
  await customer.save();
  res.json({ success: true, customer });
});


// PUT /api/customers/:id — staff edit customer
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select('+passwordHash');
  if (!customer) throw new ApiError(404, 'Customer not found');
  const { name, surname, phone, address } = req.body;

  if (name !== undefined) {
    const value = String(name).trim();
    if (!value) throw new ApiError(400, 'Name is required');
    customer.name = value;
  }
  if (surname !== undefined) customer.surname = String(surname).trim();
  if (address !== undefined) customer.address = String(address).trim();
  if (phone !== undefined) {
    const value = String(phone).trim();
    if (value && !isValidUzPhone(value)) throw new ApiError(400, 'Phone number must be in the exact format +998 XX XXX XX XX');
    if (value) {
      const existing = await Customer.findOne({ phone: value, _id: { $ne: customer._id } }).select('_id');
      if (existing) throw new ApiError(409, 'This phone number is already used by another customer');
    }
    customer.phone = value || undefined;
  }

  await customer.save();
  const safe = customer.toObject();
  delete safe.passwordHash;
  res.json({ success: true, customer: safe });
});

// DELETE /api/customers/:id — staff permanently deletes customer
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  await Customer.deleteOne({ _id: customer._id });
  res.json({ success: true, message: 'Customer deleted' });
});

// GET /api/customers/leaderboard?limit=20  (public) — top customers by loyalty points
const leaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const customers = await Customer.find({ isActive: true, points: { $gt: 0 } })
    .select('name points totalOrders')
    .sort({ points: -1 })
    .limit(limit);
  res.json({ success: true, leaderboard: customers });
});

// -- Customer's own profile/address/order-history endpoints --

// PUT /api/customers/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, surname, phone, address } = req.body;

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) throw new ApiError(400, 'Name is required');
    req.customer.name = trimmedName;
  }

  if (surname !== undefined) req.customer.surname = String(surname).trim();

  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (!isValidUzPhone(trimmedPhone)) {
      throw new ApiError(400, 'Phone number must be in the exact format +998 XX XXX XX XX');
    }

    const existing = await Customer.findOne({
      phone: trimmedPhone,
      _id: { $ne: req.customer._id }
    }).select('_id');

    if (existing) throw new ApiError(409, 'This phone number is already used by another customer');
    req.customer.phone = trimmedPhone;
  }

  if (address !== undefined) req.customer.address = String(address).trim();

  await req.customer.save();
  res.json({ success: true, customer: req.customer });
});

// POST /api/customers/me/addresses
const addMyAddress = asyncHandler(async (req, res) => {
  const { label, address, isDefault } = req.body;
  if (!address) throw new ApiError(400, 'address is required');

  if (isDefault) req.customer.addresses.forEach(a => { a.isDefault = false; });
  req.customer.addresses.push({ label, address, isDefault: !!isDefault });
  await req.customer.save();
  res.status(201).json({ success: true, customer: req.customer });
});

// DELETE /api/customers/me/addresses/:addressId
const deleteMyAddress = asyncHandler(async (req, res) => {
  req.customer.addresses = req.customer.addresses.filter(
    a => a._id.toString() !== req.params.addressId
  );
  await req.customer.save();
  res.json({ success: true, customer: req.customer });
});

// GET /api/customers/me/orders
const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.customer._id })
    .populate('brand', 'name logo mainColor')
    .populate('courier', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

module.exports = {
  listCustomers,
  getCustomer,
  updateCustomerStatus,
  updateCustomer,
  deleteCustomer,
  leaderboard,
  updateMyProfile,
  addMyAddress,
  deleteMyAddress,
  myOrders
};
