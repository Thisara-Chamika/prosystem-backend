import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const categoriesController = new CategoriesController();

router.use(authenticate);

// GET /api/categories — ALL roles (cashier needs this!)
router.get(
  '/',
  categoriesController.getCategories.bind(categoriesController)
);

// PUT /api/categories/reorder — must be BEFORE /:categoryId!
router.put(
  '/reorder',
  authorize('shop_owner', 'shop_manager'),
  categoriesController.reorderCategories.bind(categoriesController)
);

// POST /api/categories
router.post(
  '/',
  authorize('shop_owner', 'shop_manager'),
  categoriesController.createCategory.bind(categoriesController)
);

// PUT /api/categories/:categoryId
router.put(
  '/:categoryId',
  authorize('shop_owner', 'shop_manager'),
  categoriesController.updateCategory.bind(categoriesController)
);

// DELETE /api/categories/:categoryId
router.delete(
  '/:categoryId',
  authorize('shop_owner'),
  categoriesController.deleteCategory.bind(categoriesController)
);

export default router;