/**
 * Payment Component
 * 
 * This component handles the Stripe payment flow using Stripe Elements.
 * It displays a payment form where users can enter card details.
 * 
 * Props:
 * - onPaymentSuccess: Callback function when payment succeeds
 * - onPaymentFailure: Callback function when payment fails
 * - onLogout: Function to handle user logout
 */

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe with your publishable key
// In production, this should come from environment variables
const stripePromise = loadStripe(import.meta.env.STRIPE_PUBLISHABLE_KEY || "pk_test_your_stripe_publishable_key_here");

/**
 * CheckoutForm Component
 * 
 * Internal component that uses Stripe Elements hooks
 */
function CheckoutForm({ onPaymentSuccess, onPaymentFailure }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setProcessing(false);
      return;
    }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      if (onPaymentFailure) onPaymentFailure(submitError.message);
    } else {
      setSucceeded(true);
      setProcessing(false);
      if (onPaymentSuccess) onPaymentSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3 className="payment-title">Complete Your Payment</h3>
      <p className="payment-subtitle">Upgrade to continue creating unlimited tasks</p>
      
      <PaymentElement className="payment-element" />
      
      {error && <div className="payment-error">{error}</div>}
      
      {succeeded ? (
        <div className="payment-success">
          Payment successful! You can now create unlimited tasks.
        </div>
      ) : (
        <button
          type="submit"
          disabled={!stripe || processing}
          className="payment-submit-button"
        >
          {processing ? "Processing..." : "Pay $1.00"}
        </button>
      )}
    </form>
  );
}

/**
 * Payment Component
 * 
 * Main component that fetches payment intent and renders Stripe Elements
 */
function Payment({ onPaymentSuccess, onPaymentFailure, onLogout }) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Create payment intent when component mounts
    fetch("/api/payment/create-pay-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: 1 }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to initialize payment");
        setLoading(false);
      });
  }, []);

  const handlePaymentSuccess = () => {
    if (onPaymentSuccess) onPaymentSuccess();
  };

  const handlePaymentFailure = (errorMessage) => {
    if (onPaymentFailure) onPaymentFailure(errorMessage);
  };

  if (loading) {
    return <div className="payment-loading">Loading payment form...</div>;
  }

  if (error) {
    return (
      <div className="payment-container">
        <div className="payment-error">{error}</div>
        <button onClick={onLogout} className="payment-logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h2 className="payment-header">Upgrade Your Account</h2>
      <p className="payment-description">
        You've reached your free task limit. Upgrade to continue creating unlimited tasks.
      </p>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        </Elements>
      )}
      
      <button onClick={onLogout} className="payment-logout-button">
        Logout
      </button>
    </div>
  );
}

export default Payment;
