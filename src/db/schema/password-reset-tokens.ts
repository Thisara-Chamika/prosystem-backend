import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  resetTokenId: uuid('reset_token_id')
    .primaryKey()
    .defaultRandom(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),

  tokenHash: varchar('token_hash', { length: 255 })
    .notNull(),

  expiresAt: timestamp('expires_at', { mode: 'date' })
    .notNull(),

  used: boolean('used')
    .default(false)
    .notNull(),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;