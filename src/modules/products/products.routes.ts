import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/auth.middleware';

const router = Router();
const productsController = new ProductsController();

// All product routes require authentication
router.use(authenticate);

// ── PRODUCT ROUTES ────────────────────────────────
// Get all products (everyone can view)
router.get(
  '/',
  productsController.getProducts.bind(productsController)
);

// Get single product
router.get(
  '/:productId',
  productsController.getProductById.bind(productsController)
);

// Get product with inventory
router.get(
  '/:productId/inventory',
  productsController.getProductWithInventory.bind(productsController)
);

// Create product (only owner and manager)
router.post(
  '/',
  authorize('shop_owner', 'shop_manager'),
  productsController.createProduct.bind(productsController)
);

// Update product (only owner and manager)
router.put(
  '/:productId',
  authorize('shop_owner', 'shop_manager'),
  productsController.updateProduct.bind(productsController)
);

// Delete product (only owner)
router.delete(
  '/:productId',
  authorize('shop_owner'),
  productsController.deleteProduct.bind(productsController)
);

// Update inventory (owner and manager)
router.patch(
  '/:productId/inventory',
  authorize('shop_owner', 'shop_manager'),
  productsController.updateInventory.bind(productsController)
);

export default router;