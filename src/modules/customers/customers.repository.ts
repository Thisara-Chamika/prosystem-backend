import { db } from '../../config/database';
import { customers } from '../../db/schema/customers';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';
import { NewCustomer } from '../../db/schema/customers';
import { CustomerFilters } from './customers.types';

export class CustomersRepository {

  // Create customer
  async createCustomer(data: NewCustomer) {
    const result = await db
      .insert(customers)
      .values(data)
      .returning();
    return result[0];
  }

  // Get all customers
  async getCustomers(shopId: string, filters: CustomerFilters) {
  const limit = filters.limit ?? 10;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const conditions = [eq(customers.shopId, shopId)];

  if (filters.search) {
    conditions.push(
      or(
        ilike(customers.firstName, `%${filters.search}%`),
        ilike(customers.lastName, `%${filters.search}%`),
        ilike(customers.phone, `%${filters.search}%`),
        ilike(customers.email, `%${filters.search}%`)
      )!
    );
  }

  // ── COUNT query ───────────────────────────────
  const countResult = await db
    .select({ count: count() })
    .from(customers)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);
  // ─────────────────────────────────────────────

  const data = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);

  return { data, total };
}

  // Get customer by ID
  async getCustomerById(customerId: string, shopId: string) {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.customerId, customerId),
          eq(customers.shopId, shopId)
        )
      )
      .limit(1);
    return result[0] ?? null;
  }

  // Get customer by phone
  async getCustomerByPhone(phone: string, shopId: string) {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.phone, phone),
          eq(customers.shopId, shopId)
        )
      )
      .limit(1);
    return result[0] ?? null;
  }

  // Update customer
  async updateCustomer(customerId: string, shopId: string, data: Partial<NewCustomer>, userId: string) {
    const result = await db
      .update(customers)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.customerId, customerId),
          eq(customers.shopId, shopId)
        )
      )
      .returning();
    return result[0] ?? null;
  }
}