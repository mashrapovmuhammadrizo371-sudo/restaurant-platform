// Central definition of roles and the permission keys admins can be granted.
const ROLES = Object.freeze({
  BOSS: 'boss',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  COURIER: 'courier',
  OFITSIANT: 'ofitsiant',
  CASHIER: 'cashier' // architecture reserved for future use
});

// Permission keys that can be individually granted to an ADMIN role user.
// Boss implicitly has all of these; other roles use fixed logic, not this list.
const PERMISSIONS = Object.freeze([
  'brands.manage',
  'menu.manage',
  'categories.manage',
  'foods.manage',
  'banners.manage',
  'tables.manage',
  'orders.manage',
  'customers.manage',
  'promocodes.manage',
  'employees.manage',
  'settings.manage'
]);

function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

module.exports = { ROLES, PERMISSIONS, isValidRole };
