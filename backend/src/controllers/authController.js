const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { isValidUzPhone } = require('../utils/phoneValidator');
const User = require('../models/User');
const Customer = require('../models/Customer');

const PHONE_FORMAT_ERROR = 'Phone number must be in the exact format +998 XX XXX XX XX';

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

// POST /api/auth/customer/guest  — { name }
// The current customer-facing entry point: enter a name, get a session,
// browse and order. No phone/password required. Creates a lightweight
// Customer record with no phone (phone is optional on the model) and an
// unusable random password hash, since there is no password login path
// for guest customers.
//
// Note: this always creates a NEW customer record — there is currently no
// way to "log back in" as the same guest identity on a different browser
// or after clearing local storage (their JWT is what identifies them, per
// the session-restore logic in CustomerAuthContext). Order history/points
// tied to a name-only session live only as long as that token does.
// customerRegister/customerLogin below remain available for a real
// phone+password account with a durable, cross-device identity — the
// frontend just doesn't route to them right now.
const customerGuest = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    throw new ApiError(400, 'Name is required');
  }

  const passwordHash = await Customer.hashPassword(crypto.randomBytes(24).toString('hex'));
  const customer = await Customer.create({ name: String(name).trim(), passwordHash });

  const token = signToken({ sub: customer._id.toString(), type: 'customer' });
  const safeCustomer = customer.toObject();
  delete safeCustomer.passwordHash;

  res.status(201).json({ success: true, token, customer: safeCustomer });
});

// POST /api/auth/customer/register  (kept for future use — not currently
// linked from the frontend, which uses customerGuest instead)
const customerRegister = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    throw new ApiError(400, 'Name, phone and password are required');
  }

  const trimmedPhone = phone.trim();
  if (!isValidUzPhone(trimmedPhone)) {
    throw new ApiError(400, PHONE_FORMAT_ERROR);
  }

  const existing = await Customer.findOne({ phone: trimmedPhone });
  if (existing) throw new ApiError(409, 'A customer with this phone number already exists');

  const passwordHash = await Customer.hashPassword(password);
  const customer = await Customer.create({ name, phone: trimmedPhone, passwordHash });

  const token = signToken({ sub: customer._id.toString(), type: 'customer' });
  const safeCustomer = customer.toObject();
  delete safeCustomer.passwordHash;

  res.status(201).json({ success: true, token, customer: safeCustomer });
});

// POST /api/auth/customer/login  (kept for future use, see above)
const customerLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) throw new ApiError(400, 'Phone and password are required');

  const trimmedPhone = phone.trim();
  if (!isValidUzPhone(trimmedPhone)) {
    throw new ApiError(400, PHONE_FORMAT_ERROR);
  }

  const customer = await Customer.findOne({ phone: trimmedPhone }).select('+passwordHash');
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

module.exports = {
  staffLogin,
  staffMe,
  customerGuest,
  customerRegister,
  customerLogin,
  customerMe
};
