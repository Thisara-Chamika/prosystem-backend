import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/auth.middleware';

const router = Router();
const customersController = new CustomersController();

// All routes require authentication
router.use(authenticate);

// Get all customers
router.get(
  '/',
  customersController.getCustomers.bind(customersController)
);

// Get single customer
router.get(
  '/:customerId',
  customersController.getCustomerById.bind(customersController)
);

// Create customer
router.post(
  '/',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  customersController.createCustomer.bind(customersController)
);

// Update customer
router.put(
  '/:customerId',
  authorize('shop_owner', 'shop_manager'),
  customersController.updateCustomer.bind(customersController)
);

export default router;