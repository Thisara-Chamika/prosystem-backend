import { AdminRepository } from './admin.repository';
import { createAuditLog } from '../../utils/audit.utils';
import { AuditAction } from '../../enums/audit-actions.enum';

const adminRepository = new AdminRepository();

export class AdminService {
  async getMetrics() {
    return await adminRepository.getMetrics();
  }

  async getShops(filters: { search?: string; page?: number; limit?: number }) {
    return await adminRepository.getShops(filters);
  }

  async updateShopStatus(shopId: string, isActive: boolean, adminUserId: string) {
    const shop = await adminRepository.updateShopStatus(shopId, isActive);

    if (!shop) {
      throw new Error('Shop not found!');
    }

    // Create an audit log for the shop status update
    await createAuditLog({
      shopId: shop.shopId,
      userId: adminUserId,
      action: isActive ? AuditAction.SHOP_REACTIVATED_BY_ADMIN : AuditAction.SHOP_DEACTIVATED_BY_ADMIN,
      entityType: 'shop',
      entityId: shop.shopId,
      details: { isActive },
    });

    return shop;
  }
}