// scripts/promote-super-admin.ts
// Run via: npm run promote-admin
// Requires SUPER_ADMIN_EMAIL set in .env
// The target user must already be registered normally
// (real email, real bcrypt password) through the
// standard public register flow before running this.

import { dbBypass } from '../src/config/database-bypass';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';

async function promoteToSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;

  if (!email) {
    throw new Error('SUPER_ADMIN_EMAIL not set in .env');
  }

  const existing = await dbBypass
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existing[0]) {
    throw new Error(
      `No registered account found with email "${email}". Register normally first, then run this script.`
    );
  }

  await dbBypass
    .update(users)
    .set({ role: 'super_admin', shopId: null })
    .where(eq(users.userId, existing[0].userId));

  console.log(`✅ ${email} promoted to super_admin`);
  process.exit(0);
}

promoteToSuperAdmin().catch((error) => {
  console.error('❌ Promotion failed:', error.message);
  process.exit(1);
});