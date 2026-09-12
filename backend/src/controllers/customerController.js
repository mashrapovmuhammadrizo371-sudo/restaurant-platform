const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// GET /api/customers  (staff only — admin/boss customer management)
const listCustomers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, customers });
});

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, customer });
});

// -- Customer's own profile/address/order-history endpoints --

// PUT /api/customers/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (name !== undefined) req.customer.name = name;
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
  updateMyProfile,
  addMyAddress,
  deleteMyAddress,
  myOrders
};
