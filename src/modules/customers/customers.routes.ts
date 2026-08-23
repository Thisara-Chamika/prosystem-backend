import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/auth.middleware';
import { LoyaltyController } from '../loyalty/loyalty.controller';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();
const customersController = new CustomersController();
const loyaltyController = new LoyaltyController();

// Middleware to authenticate and set RLS context for all customer routes
router.use(authenticate);
router.use(setRlsContext);

// Get all customers
router.get(
  '/',
  customersController.getCustomers.bind(customersController)
);

// Get customer profile
router.get(
  '/:customerId/profile',
  loyaltyController.getCustomerProfile.bind(loyaltyController)
);

// Get customer loyalty
router.get(
  '/:customerId/loyalty',
  loyaltyController.getCustomerLoyalty.bind(loyaltyController)
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