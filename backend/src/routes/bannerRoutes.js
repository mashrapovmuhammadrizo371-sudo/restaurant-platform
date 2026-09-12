const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');

router.get('/', optionalAuthenticate(), listBanners);

router.post(
  '/',
  authenticate(),
  requirePermission('banners.manage'),
  requireBrandAccess(),
  upload.single('image'),
  createBanner
);
router.put('/:id', authenticate(), requirePermission('banners.manage'), upload.single('image'), updateBanner);
router.delete('/:id', authenticate(), requirePermission('banners.manage'), deleteBanner);

module.exports = router;
