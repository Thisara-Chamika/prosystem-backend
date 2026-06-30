import { CustomersRepository } from './customers.repository';
import { CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from './customers.types';
import { emailService } from '../../services/EmailService';
import { ShopsRepository } from '../shops/shops.repository';

const shopsRepository = new ShopsRepository();
const customersRepository = new CustomersRepository();

export class CustomersService {

  // Create customer
  async createCustomer(input: CreateCustomerInput, shopId: string, userId: string) {
    // Check if phone already exists in this shop
    if (input.phone) {
      const existing = await customersRepository.getCustomerByPhone(input.phone, shopId);
      if (existing) {
        throw new Error('Customer with this phone already exists!');
      }
    }

    const customer = await customersRepository.createCustomer({
      ...input,
      shopId,
      createdBy: userId,
      updatedBy: userId,
    });

    // ── Send welcome email (never breaks customer creation!) ──
    if (customer.email) {
      try {
        const shop = await shopsRepository.getShopById(shopId);
        const prefs = (shop?.configuration as any)?.emailNotifications ?? {};

        if (prefs.customerWelcomeEmails !== false) {
          await emailService.sendCustomerWelcomeEmail({
            to: customer.email,
            customerName: customer.firstName,
            shopName: shop?.name ?? 'Shop',
          }).catch(err => {
            console.error('Failed to send customer welcome email:', err);
          });
        }
      } catch (error) {
        console.error('Customer welcome email error:', error);
      }
    }

    return customer;
  }

  // Get all customers
  async getCustomers(shopId: string, filters: CustomerFilters) {
    return await customersRepository.getCustomers(shopId, filters);
  }

  // Get single customer
  async getCustomerById(customerId: string, shopId: string) {
    const customer = await customersRepository.getCustomerById(customerId, shopId);
    if (!customer) {
      throw new Error('Customer not found!');
    }
    return customer;
  }

  // Update customer
  async updateCustomer(customerId: string, shopId: string, input: UpdateCustomerInput, userId: string) {
    const existing = await customersRepository.getCustomerById(customerId, shopId);
    if (!existing) {
      throw new Error('Customer not found!');
    }

    return await customersRepository.updateCustomer(
      customerId,
      shopId,
      input,
      userId
    );
  }
}