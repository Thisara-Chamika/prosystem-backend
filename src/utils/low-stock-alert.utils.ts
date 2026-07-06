import { InventoryRepository } from '../modules/inventory/inventory.repository';
import { ShopsRepository } from '../modules/shops/shops.repository';
import { emailService } from '../services/EmailService';

const inventoryRepository = new InventoryRepository();
const shopsRepository = new ShopsRepository();

export async function checkAndSendLowStockAlerts(shopId: string) {
  try {
    // 1. Check if already sent today
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) return;

    const lastSent = await shopsRepository.getLastLowStockAlertSent(shopId);
    const today = new Date().toDateString();
    const lastSentDate = lastSent ? new Date(lastSent).toDateString() : null;

    if (lastSentDate === today) return; // already sent today!

    // 2. Get low stock items
    const lowStockItems = await inventoryRepository
      .getLowStockItemsForAlert(shopId);

    if (lowStockItems.length === 0) return; // nothing to alert about!

    // 3. Check preference
    const prefs = (shop.configuration as any)?.emailNotifications ?? {};
    if (prefs.lowStockAlerts === false) return;

    // 4. Get owner + managers
    const recipients = await shopsRepository.getOwnerAndManagers(shopId);

    // 5. Send to each recipient
    for (const recipient of recipients) {
      if (recipient.email) {
        await emailService.sendLowStockAlert({
          to: recipient.email,
          recipientName: recipient.firstName,
          shopName: shop.name,
          items: lowStockItems.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint ?? 0,
          })),
        }).catch(err => {
          console.error(
            `Failed to send low stock alert to ${recipient.email}:`, err
          );
        });
      }
    }

    // 6. Mark as sent today
    await shopsRepository.markLowStockAlertSent(shopId);

  } catch (error) {
    console.error('Low stock alert check error:', error);
  }
}