const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { isValidUzPhone } = require('../utils/phoneValidator');
const User = require('../models/User');
const Customer = require('../models/Customer');

const PHONE_FORMAT_ERROR = 'Phone number must be in the exact format +998 XX XXX XX XX';
const DEFAULT_GUEST_NAME = 'Mehmon';

async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new ApiError(500, 'reCAPTCHA server key is not configured');
  if (!token) throw new ApiError(400, 'Please complete the reCAPTCHA verification');

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {})
    })
  });

  if (!response.ok) throw new ApiError(502, 'reCAPTCHA verification service is unavailable');
  const result = await response.json();
  if (!result.success) throw new ApiError(400, 'reCAPTCHA verification failed');
}

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

// POST /api/auth/customer/guest  — { name?: string }
// The current customer-facing entry point. Customer registration/login is
// temporarily removed per product requirement: there is no login page and
// no required interaction at all — the frontend calls this automatically,
// silently, the first time a visitor arrives with no stored session, so
// they can start browsing/ordering immediately. `name` is optional; a
// generic default is used if omitted (kept accepting an explicit name too,
// since nothing about the endpoint requires removing that — a future UI
// could still let someone set a display name without a new endpoint).
//
// The returned JWT, stored client-side, IS the "secure session identifier
// stored on the device" used to look up "My Orders" without an account —
// no separate mechanism is introduced for that.
//
// Creates a lightweight Customer record with an unusable random password
// hash, since there is no password login path for anonymous/guest
// customers. Note: this always creates a NEW customer record — there is
// no way to "log back in" as the same anonymous identity on a different
// browser or after clearing local storage. customerRegister/customerLogin
// below remain available for a real phone+password account with a
// durable, cross-device identity (e.g. for a future mobile app) — the
// current frontend just doesn't route to them.
const customerGuest = asyncHandler(async (req, res) => {
  const rawName = req.body && req.body.name;
  const name = rawName && String(rawName).trim() ? String(rawName).trim() : DEFAULT_GUEST_NAME;

  const passwordHash = await Customer.hashPassword(crypto.randomBytes(24).toString('hex'));
  const customer = await Customer.create({ name, passwordHash });

  const token = signToken({ sub: customer._id.toString(), type: 'customer' });
  const safeCustomer = customer.toObject();
  delete safeCustomer.passwordHash;

  res.status(201).json({ success: true, token, customer: safeCustomer });
});

// POST /api/auth/customer/register  (kept for future use — not currently
// linked from the frontend, which uses customerGuest instead)
const customerRegister = asyncHandler(async (req, res) => {
  const { name, surname, phone, password, address, recaptchaToken } = req.body;
  if (!name || !phone || !password) {
    throw new ApiError(400, 'Name, phone and password are required');
  }

  const trimmedPhone = phone.trim();
  if (!isValidUzPhone(trimmedPhone)) {
    throw new ApiError(400, PHONE_FORMAT_ERROR);
  }

  await verifyRecaptcha(recaptchaToken, req.ip);

  const existing = await Customer.findOne({ phone: trimmedPhone });
  if (existing) throw new ApiError(409, 'A customer with this phone number already exists');

  const passwordHash = await Customer.hashPassword(password);
  const customer = await Customer.create({ name, surname: surname ? String(surname).trim() : '', phone: trimmedPhone, address: address ? String(address).trim() : '', passwordHash });

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
  customerMe,
  verifyRecaptcha
};
