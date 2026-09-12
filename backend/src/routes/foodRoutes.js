const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const {
  listFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood
} = require('../controllers/foodController');

router.get('/', optionalAuthenticate(), listFoods);
router.get('/:id', optionalAuthenticate(), getFood);

router.post(
  '/',
  authenticate(),
  requirePermission('foods.manage'),
  requireBrandAccess(),
  upload.single('image'),
  createFood
);
router.put('/:id', authenticate(), requirePermission('foods.manage'), upload.single('image'), updateFood);
router.delete('/:id', authenticate(), requirePermission('foods.manage'), deleteFood);

module.exports = router;
