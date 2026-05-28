/**
 * Payment Component
 *
 * This component handles the Stripe payment flow using Stripe Elements.
 * It displays a payment form where users can enter card details.
 *
 * Props:
 * - onPaymentSuccess: Optional callback for externally updated payment state
 * - onPaymentFailure: Callback function when payment fails
 * - onLogout: Function to handle user logout
 * - onClose: Function to dismiss the payment modal and return to dashboard
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
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

/**
 * CheckoutForm Component
 *
 * Internal component that uses Stripe Elements hooks
 */
function CheckoutForm({ onPaymentFailure, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState("");

  const handleRetry = () => {
    setPaymentMessage(null);
    setFormError("");
    setProcessing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setFormError("");
    setPaymentMessage(null);

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
      const failureMessage =
        submitError.message || "Payment failed. Please try again.";
      setFormError(failureMessage);
      setPaymentMessage({
        type: "error",
        title: "Payment failed",
        message: failureMessage,
      });
      setProcessing(false);

      if (onPaymentFailure) onPaymentFailure(failureMessage);
    } else {
      setPaymentMessage({
        type: "success",
        title: "Payment successful",
        message:
          "Your payment was processed. You can now close this message and return to the dashboard.",
      });
      setProcessing(false);
    }
  };

  if (paymentMessage) {
    const isSuccess = paymentMessage.type === "success";

    return (
      <div className="payment-form">
        <div
          className={`payment-status-message ${isSuccess ? "payment-success" : "payment-error"}`}
        >
          <div className="payment-status-icon">{isSuccess ? "✅" : "❌"}</div>
          <div>
            <h3>{paymentMessage.title}</h3>
            <p>{paymentMessage.message}</p>
          </div>
        </div>

        <div className="payment-status-actions">
          {isSuccess ? (
            <button
              type="button"
              className="payment-submit-button"
              onClick={() => onClose && onClose()}
            >
              Return to Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                className="payment-submit-button"
                onClick={handleRetry}
              >
                Retry Payment
              </button>
              <button
                type="button"
                className="payment-logout-button"
                onClick={() => onClose && onClose()}
              >
                Cancel Payment
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3 className="payment-title">Complete Your Payment</h3>
      <p className="payment-subtitle">
        Upgrade to continue creating unlimited tasks
      </p>

      <PaymentElement className="payment-element" />

      {formError && <div className="payment-error">{formError}</div>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="payment-submit-button"
      >
        {processing ? "Processing..." : "Pay $1.00"}
      </button>
    </form>
  );
}

/**
 * Payment Component
 *
 * Main component that fetches payment intent and renders Stripe Elements
 */
function Payment({ onPaymentFailure, onLogout, onClose }) {
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
      .catch(() => {
        setError("Failed to initialize payment");
        setLoading(false);
      });
  }, []);

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
        You've reached your free task limit. Upgrade to continue creating
        unlimited tasks.
      </p>

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm onPaymentFailure={onPaymentFailure} onClose={onClose} />
        </Elements>
      )}

      <button onClick={onLogout} className="payment-logout-button">
        Logout
      </button>
    </div>
  );
}

export default Payment;
