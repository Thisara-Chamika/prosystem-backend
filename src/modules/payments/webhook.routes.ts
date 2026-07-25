import { Router, raw } from 'express';
import { paymentsService } from './payments.service';

const router = Router();

// POST /api/webhooks/stripe
// Public — Stripe calls this directly, no user JWT involved.
// Uses express.raw() instead of express.json() specifically
// for this route, since Stripe's signature verification needs
// the exact raw request bytes, not a parsed object.
router.post(
  '/',
  raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || typeof sig !== 'string') {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event;
    try {
      event = paymentsService.constructWebhookEvent(req.body, sig);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook signature verification failed`);
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as any;
        // Safety net: if a transaction with this paymentIntentId
        // doesn't already exist, that means the customer's card
        // was charged but our POST /api/pos call never completed
        // (e.g. browser crash/lost connection right after payment).
        // For now, just log a warning for manual review — auto-creating
        // a transaction from a webhook alone would mean guessing at
        // items/customerId/discount with no idea what was in the cart.
        console.log('✅ Payment succeeded (webhook):', intent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as any;
        console.log('❌ Payment failed (webhook):', intent.id);
        break;
      }

      default:
        // Unhandled event types are fine to ignore silently —
        // Stripe sends many event types we don't need to react to.
        break;
    }

    res.json({ received: true });
  }
);

export default router;