const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

// Restricts a route to specific staff roles. Boss always passes.
function requireRole(...allowedRoles) {
  return function requireRoleMiddleware(req, res, next) {
    if (req.principalType !== 'staff' || !req.user) {
      return next(new ApiError(403, 'Staff authentication required'));
    }
    if (req.user.role === ROLES.BOSS) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient role for this action'));
    }
    next();
  };
}

// Restricts a route to admins holding a specific permission key.
// Boss always passes. Non-admin roles are rejected (they use requireRole
// instead, since their access is role-fixed rather than permission-based).
function requirePermission(permissionKey) {
  return function requirePermissionMiddleware(req, res, next) {
    if (req.principalType !== 'staff' || !req.user) {
      return next(new ApiError(403, 'Staff authentication required'));
    }
    if (req.user.role === ROLES.BOSS) return next();
    if (req.user.role !== ROLES.ADMIN) {
      return next(new ApiError(403, 'Insufficient role for this action'));
    }
    if (!req.user.permissions.includes(permissionKey)) {
      return next(new ApiError(403, `Missing permission: ${permissionKey}`));
    }
    next();
  };
}

// Ensures the acting admin/employee has access to the brand referenced by
// the request (via req.params.brandId, req.body.brand, or req.query.brand).
// Boss always passes. Looks at req.user.brands for admin/operator/courier/ofitsiant.
function requireBrandAccess() {
  return function requireBrandAccessMiddleware(req, res, next) {
    if (req.principalType !== 'staff' || !req.user) {
      return next(new ApiError(403, 'Staff authentication required'));
    }
    if (req.user.role === ROLES.BOSS) return next();

    const brandId = req.params.brandId || req.body.brand || req.query.brand;
    if (!brandId) {
      // Some routes (e.g. "list my own orders") don't need an explicit brand;
      // controllers should scope queries to req.user.brands themselves in that case.
      return next();
    }

    const allowed = req.user.brands.map(String).includes(String(brandId));
    if (!allowed) {
      return next(new ApiError(403, 'No access to this brand'));
    }
    next();
  };
}

// Like requireBrandAccess, but reads the brand id straight from req.params[paramName]
// — for routes where the resource IN the URL *is* the brand itself (e.g. PUT /brands/:id).
function requireBrandAccessByParam(paramName = 'id') {
  return function requireBrandAccessByParamMiddleware(req, res, next) {
    if (req.principalType !== 'staff' || !req.user) {
      return next(new ApiError(403, 'Staff authentication required'));
    }
    if (req.user.role === ROLES.BOSS) return next();

    const brandId = req.params[paramName];
    const allowed = req.user.brands.map(String).includes(String(brandId));
    if (!allowed) return next(new ApiError(403, 'No access to this brand'));
    next();
  };
}

module.exports = { requireRole, requirePermission, requireBrandAccess, requireBrandAccessByParam };
