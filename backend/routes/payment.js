/**
 * Payment Routes
 * 
 * This module defines Express routes for Stripe payment integration.
 * Routes include:
 * - POST /create-pay-intent: Create a Stripe payment intent
 * - POST /webhook: Handle Stripe webhook events
 * - GET /status: Check user payment status
 */

const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");
const db = require("../db");
const router = express.Router();

/**
 * Stripe Webhook Handler
 * 
 * POST /api/payment/webhook
 * 
 * This endpoint does NOT require authentication (it's called by Stripe)
 * 
 * Handles:
 * - payment_intent.succeeded: Update user to paid status
 * - payment_intent.payment_failed: Log payment failure
 */
router.post("/webhook", async (req, res) => {
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
        
        console.log(`Payment succeeded for user ${userId}`);
        
        // Update user payment status to paid
        await db
          .promise()
          .query(
            "UPDATE user SET payment_status = 'paid' WHERE id = ?",
            [userId]
          );
        
        console.log(`User ${userId} payment status updated to paid`);
        break;
      }
      
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        
        console.log(`Payment failed for user ${userId}`);
        console.log(`Payment failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    console.error(error.stack);

    res.status(400).json({
      error: error.message,
    });
  }
});

// Apply authentication middleware to all routes except webhook
router.use(auth);

/**
 * Create a Stripe Payment Intent
 * 
 * POST /api/payment/create-pay-intent
 * 
 * Request body:
 * - amount: Amount in dollars (will be converted to cents)
 * 
 * Response:
 * - 200: Payment intent object with client secret
 * - 400: Validation errors
 * - 500: Server error
 */
router.post("/create-pay-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Validate amount (default to $1.00 if not provided)
    const amountInCents = (amount || 1) * 100;
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        userId: req.session.userId,
      },
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

/**
 * Get User Payment Status
 * 
 * GET /api/payment/status
 * 
 * Response:
 * - 200: User payment status and task count
 * - 500: Server error
 */
router.get("/status", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT payment_status, tasks_created FROM user WHERE id = ?",
        [req.session.userId]
      );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = rows[0];
    const freeTasksRemaining = Math.max(0, 3 - user.tasks_created);
    
    res.json({
      paymentStatus: user.payment_status,
      tasksCreated: user.tasks_created,
      freeTasksRemaining,
      isPaywalled: user.payment_status === 'free' && user.tasks_created >= 3,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});



module.exports = router;
