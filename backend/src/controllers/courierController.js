const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { ROLES } = require('../config/roles');

// GET /api/couriers?brand=<id>&availability=bo_shman
// Used by the Operator panel to see who can be assigned.
const listCouriers = asyncHandler(async (req, res) => {
  const filter = { role: ROLES.COURIER };
  if (req.query.brand) filter.brands = req.query.brand;
  if (req.query.availability) filter.courierAvailability = req.query.availability;

  if (req.user.role !== ROLES.BOSS) {
    filter.brands = { $in: req.user.brands };
  }

  const couriers = await User.find(filter).sort({ name: 1 });
  res.json({ success: true, couriers: couriers.map(c => c.toSafeJSON()) });
});

// PUT /api/couriers/me/availability  { availability: 'bo_shman' | 'bandman' }
// Courier manually sets their own status. Never changed automatically by the system.
const setMyAvailability = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.COURIER) throw new ApiError(403, 'Only couriers can set availability');
  const { availability } = req.body;
  if (!['bo_shman', 'bandman'].includes(availability)) {
    throw new ApiError(400, 'availability must be "bo_shman" or "bandman"');
  }
  req.user.courierAvailability = availability;
  await req.user.save();
  res.json({ success: true, courier: req.user.toSafeJSON() });
});

module.exports = { listCouriers, setMyAvailability };
