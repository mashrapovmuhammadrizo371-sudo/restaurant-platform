const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requireRole, requirePermission, requireBrandAccessByParam } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/roles');
const {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');

// Public + staff (list is scoped inside the controller by principal type)
router.get('/', optionalAuthenticate(), listBrands);
router.get('/:id', optionalAuthenticate(), getBrand);

// Boss creates/deletes brands. Admin with 'brands.manage' can update their own.
router.post('/', authenticate(), requireRole(ROLES.BOSS), upload.single('logo'), createBrand);
router.put(
  '/:id',
  authenticate(),
  requirePermission('brands.manage'),
  requireBrandAccessByParam('id'),
  upload.single('logo'),
  updateBrand
);
router.delete('/:id', authenticate(), requireRole(ROLES.BOSS), deleteBrand);

module.exports = router;
