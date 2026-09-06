const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Customer = require('../models/Customer');

// Verifies a Bearer token and loads the acting principal onto req.
// Works for both staff (User) and customer (Customer) tokens, distinguished
// by the `type` claim set at sign-time.
function authenticate() {
  return async function authenticateMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new ApiError(401, 'Missing or malformed Authorization header');
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        throw new ApiError(401, 'Invalid or expired token');
      }

      if (decoded.type === 'staff') {
        const user = await User.findById(decoded.sub);
        if (!user || !user.isActive) {
          throw new ApiError(401, 'Account not found or disabled');
        }
        req.user = user;
        req.principalType = 'staff';
      } else if (decoded.type === 'customer') {
        const customer = await Customer.findById(decoded.sub);
        if (!customer || !customer.isActive) {
          throw new ApiError(401, 'Account not found or disabled');
        }
        req.customer = customer;
        req.principalType = 'customer';
      } else {
        throw new ApiError(401, 'Unrecognized token type');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Like authenticate(), but does not fail when no token is present — used for
// public endpoints (e.g. browsing the menu) that behave differently for a
// logged-in customer/staff member vs. an anonymous visitor.
function optionalAuthenticate() {
  return async function optionalAuthenticateMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return next();
    return authenticate()(req, res, next);
  };
}

module.exports = { authenticate, optionalAuthenticate };
