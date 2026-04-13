import { Request, Response } from 'express';
import { CustomersService } from './customers.service';

const customersService = new CustomersService();

export class CustomersController {

  // Create customer
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;

      const customer = await customersService.createCustomer(
        req.body,
        shopId,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Customer created successfully!',
        data: customer,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all customers
  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const customers = await customersService.getCustomers(shopId, filters);

      res.status(200).json({
        success: true,
        data: customers,
        pagination: {
          page: filters.page,
          limit: filters.limit,
        },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get single customer
  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { customerId } = req.params;

      const customer = await customersService.getCustomerById(
        customerId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: customer,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update customer
  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const { customerId } = req.params;

      const customer = await customersService.updateCustomer(
        customerId,
        shopId,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully!',
        data: customer,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}