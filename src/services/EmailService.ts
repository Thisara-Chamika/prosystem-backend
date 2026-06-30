import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'ProSystem <onboarding@resend.dev>';

interface ReceiptEmailData {
  to: string;
  customerName: string;
  shopName: string;
  transactionNumber: string;
  items: Array<{ name: string; quantity: number; total: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

interface LowStockAlertData {
  to: string;
  recipientName: string;
  shopName: string;
  items: Array<{ name: string; quantity: number; reorderPoint: number }>;
}

interface CustomerWelcomeData {
  to: string;
  customerName: string;
  shopName: string;
}

interface ShopWelcomeData {
  to: string;
  ownerName: string;
  shopName: string;
  businessType: string;
}

interface StaffWelcomeData {
  to: string;
  staffName: string;
  shopName: string;
  role: string;
  loginEmail: string;
}

export class EmailService {

  // ── 1. RECEIPT EMAIL ──────────────────────────────
  async sendReceiptEmail(data: ReceiptEmailData) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Receipt from ${data.shopName} - ${data.transactionNumber}`,
      html: this.buildReceiptTemplate(data),
    });
  }

  // ── 2. LOW STOCK ALERT ────────────────────────────
  async sendLowStockAlert(data: LowStockAlertData) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Low Stock Alert - ${data.shopName}`,
      html: this.buildLowStockTemplate(data),
    });
  }

  // ── 3. CUSTOMER WELCOME ───────────────────────────
  async sendCustomerWelcomeEmail(data: CustomerWelcomeData) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Welcome to ${data.shopName}!`,
      html: this.buildCustomerWelcomeTemplate(data),
    });
  }

  // ── 4. SHOP WELCOME ───────────────────────────────
  async sendShopWelcomeEmail(data: ShopWelcomeData) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Welcome to ProSystem, ${data.shopName}!`,
      html: this.buildShopWelcomeTemplate(data),
    });
  }

  // ── 5. STAFF WELCOME ──────────────────────────────
  async sendStaffWelcomeEmail(data: StaffWelcomeData) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `You've been added to ${data.shopName}`,
      html: this.buildStaffWelcomeTemplate(data),
    });
  }

  // ══════════════════════════════════════════════════
  // TEMPLATE BUILDERS
  // ══════════════════════════════════════════════════

  private buildReceiptTemplate(data: ReceiptEmailData): string {
    const itemRows = data.items.map(item => `
      <tr>
        <td style="padding: 8px 0; color: #333;">${item.name} x${item.quantity}</td>
        <td style="padding: 8px 0; text-align: right; color: #333;">${data.currency} ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a1a; margin-bottom: 4px;">${data.shopName}</h2>
        <p style="color: #666; margin-top: 0;">Receipt #${data.transactionNumber}</p>

        <p style="color: #333;">Hi ${data.customerName}, thank you for your purchase!</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          ${itemRows}
        </table>

        <table style="width: 100%; border-top: 1px solid #e5e5e5; padding-top: 12px;">
          <tr>
            <td style="padding: 4px 0; color: #666;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; color: #666;">${data.currency} ${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #666;">Tax</td>
            <td style="padding: 4px 0; text-align: right; color: #666;">${data.currency} ${data.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #666;">Discount</td>
            <td style="padding: 4px 0; text-align: right; color: #666;">-${data.currency} ${data.discount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #1a1a1a; border-top: 1px solid #e5e5e5;">Total</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1a1a1a; border-top: 1px solid #e5e5e5;">${data.currency} ${data.total.toFixed(2)}</td>
          </tr>
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by ProSystem</p>
      </div>
    `;
  }

  private buildLowStockTemplate(data: LowStockAlertData): string {
    const itemRows = data.items.map(item => `
      <tr>
        <td style="padding: 8px 0; color: #333;">${item.name}</td>
        <td style="padding: 8px 0; text-align: center; color: #d32f2f;">${item.quantity}</td>
        <td style="padding: 8px 0; text-align: center; color: #666;">${item.reorderPoint}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #d32f2f;">⚠️ Low Stock Alert</h2>
        <p style="color: #333;">Hi ${data.recipientName}, the following items at <strong>${data.shopName}</strong> need restocking:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <th style="text-align: left; padding: 8px 0; color: #666;">Product</th>
            <th style="text-align: center; padding: 8px 0; color: #666;">Current</th>
            <th style="text-align: center; padding: 8px 0; color: #666;">Reorder At</th>
          </tr>
          ${itemRows}
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by ProSystem</p>
      </div>
    `;
  }

  private buildCustomerWelcomeTemplate(data: CustomerWelcomeData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a1a;">Welcome to ${data.shopName}!</h2>
        <p style="color: #333;">Hi ${data.customerName},</p>
        <p style="color: #333;">Thank you for becoming a customer! We're excited to have you with us.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by ProSystem</p>
      </div>
    `;
  }

  private buildShopWelcomeTemplate(data: ShopWelcomeData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a1a;">Welcome to ProSystem, ${data.shopName}! 🎉</h2>
        <p style="color: #333;">Hi ${data.ownerName},</p>
        <p style="color: #333;">Your shop is all set up and ready to go! Here's a quick checklist to get started:</p>

        <ol style="color: #333; line-height: 1.8;">
          <li>Add your products</li>
          <li>Add staff members</li>
          <li>Configure plugins if needed</li>
          <li>Make your first sale</li>
        </ol>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by ProSystem</p>
      </div>
    `;
  }

  private buildStaffWelcomeTemplate(data: StaffWelcomeData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a1a;">You've been added to ${data.shopName}</h2>
        <p style="color: #333;">Hi ${data.staffName},</p>
        <p style="color: #333;">You've been added as a <strong>${data.role}</strong> at ${data.shopName}.</p>
        <p style="color: #333;">Your login email: <strong>${data.loginEmail}</strong></p>
        <p style="color: #666; background: #f5f5f5; padding: 12px; border-radius: 4px;">
          🔒 Contact your shop owner for your password.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Powered by ProSystem</p>
      </div>
    `;
  }
}

export const emailService = new EmailService();