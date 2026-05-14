const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../db");

const router = express.Router();

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        await db.promise().query(
          "UPDATE user SET payment_status = 'paid' WHERE id = ?",
          [userId]
        );

        console.log(`User ${userId} upgraded to paid`);
        break;
      }

      case "payment_intent.payment_failed":
        console.log("Payment failed");
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;