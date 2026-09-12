const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticate } = require('../middleware/auth');
const { requirePermission, requireBrandAccess } = require('../middleware/rbac');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

router.get('/', optionalAuthenticate(), listCategories);

router.post(
  '/',
  authenticate(),
  requirePermission('categories.manage'),
  requireBrandAccess(),
  createCategory
);
router.put('/:id', authenticate(), requirePermission('categories.manage'), updateCategory);
router.delete('/:id', authenticate(), requirePermission('categories.manage'), deleteCategory);

module.exports = router;
