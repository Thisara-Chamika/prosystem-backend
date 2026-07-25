import { stripe, STRIPE_CURRENCY } from '../../config/stripe';

export class PaymentsService {

  async createPaymentIntent(amount: number, shopId: string) {
    if (!amount || amount <= 0) {
      throw new Error('A valid positive amount is required!');
    }

    // Stripe enforces a minimum charge amount per currency —
    // for USD this is $0.50. Catching this here gives a clearer
    // error than letting Stripe's own rejection surface raw.
    if (amount < 0.50) {
      throw new Error('Amount must be at least $0.50 (Stripe minimum)!');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit (cents)
      currency: STRIPE_CURRENCY,
      metadata: {
        shopId, // for tracking which shop this belongs to in Stripe's dashboard
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // Retrieve a payment intent to check its actual status —
  // used by pos.service.ts to verify a card payment truly
  // succeeded before creating the transaction. Never trust
  // the frontend's claim alone.
  async retrievePaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // Issue a refund against a payment intent. Omitting
  // amountInCents refunds the full charged amount — used
  // both for the amount-mismatch safety net in pos.service.ts
  // and for real customer returns in Step 6.
  async refundPaymentIntent(paymentIntentId: string, amountInCents?: number) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountInCents !== undefined ? { amount: amountInCents } : {}),
    });
  }

  // Construct a Stripe webhook event from the raw request body and signature header.

constructWebhookEvent(rawBody: Buffer, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set!');
  }
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
}

export const paymentsService = new PaymentsService();