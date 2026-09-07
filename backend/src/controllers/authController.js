const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const User = require('../models/User');
const Customer = require('../models/Customer');

// POST /api/auth/staff/login
// Single shared login page for all staff. Role is detected automatically
// from the matched account and returned so the frontend can redirect.
const staffLogin = asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) throw new ApiError(400, 'Login and password are required');

  const user = await User.findOne({ login: login.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ sub: user._id.toString(), type: 'staff', role: user.role });

  res.json({
    success: true,
    token,
    user: user.toSafeJSON()
  });
});

// GET /api/auth/staff/me
const staffMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

// POST /api/auth/customer/register
const customerRegister = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    throw new ApiError(400, 'Name, phone and password are required');
  }

  const existing = await Customer.findOne({ phone });
  if (existing) throw new ApiError(409, 'A customer with this phone number already exists');

  const passwordHash = await Customer.hashPassword(password);
  const customer = await Customer.create({ name, phone, passwordHash });

  const token = signToken({ sub: customer._id.toString(), type: 'customer' });
  const safeCustomer = customer.toObject();
  delete safeCustomer.passwordHash;

  res.status(201).json({ success: true, token, customer: safeCustomer });
});

// POST /api/auth/customer/login
const customerLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) throw new ApiError(400, 'Phone and password are required');

  const customer = await Customer.findOne({ phone }).select('+passwordHash');
  if (!customer || !customer.isActive) throw new ApiError(401, 'Invalid credentials');

  const match = await customer.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ sub: customer._id.toString(), type: 'customer' });
  const safeCustomer = customer.toObject();
  delete safeCustomer.passwordHash;

  res.json({ success: true, token, customer: safeCustomer });
});

// GET /api/auth/customer/me
const customerMe = asyncHandler(async (req, res) => {
  res.json({ success: true, customer: req.customer });
});

module.exports = { staffLogin, staffMe, customerRegister, customerLogin, customerMe };
