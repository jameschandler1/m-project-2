/**
 * @fileoverview Payment component for Stripe integration
 * @description Handles Stripe payment flow using Stripe Elements.
 * Displays a payment form where users can enter card details.
 * 
 * @component Payment
 * @param {Object} props - Component props
 * @param {Function} props.onPaymentSuccess - Callback function when payment succeeds
 * @param {Function} props.onPaymentFailure - Callback function when payment fails
 * @param {Function} props.onLogout - Function to handle user logout
 * 
 * @author Generated
 * @since 1.0.0
 */
import { createSignal, onMount } from 'solid-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// In production, this should come from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

/**
 * Payment component - Stripe payment form
 * 
 * Provides a payment interface using Stripe Elements for secure card input.
 * Handles payment intent creation and confirmation.
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onPaymentSuccess - Callback when payment completes successfully
 * @param {Function} props.onPaymentFailure - Callback when payment fails
 * @param {Function} props.onLogout - Function to handle user logout
 * @returns {JSX.Element} Rendered payment component
 */
function Payment(props) {
  const [clientSecret, setClientSecret] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [processing, setProcessing] = createSignal(false);
  const [succeeded, setSucceeded] = createSignal(false);
  const [cardError, setCardError] = createSignal('');
  
  let stripe = null;
  let elements = null;
  let cardElement = null;

  /**
   * Initialize payment intent when component mounts
   */
  onMount(async () => {
    try {
      // Create payment intent
      const response = await fetch('/api/payment/create-pay-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: 1 }),
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        
        // Initialize Stripe and create Elements
        stripe = await stripePromise;
        elements = stripe.elements({
          clientSecret: data.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#282c34',
            },
          },
        });
        
        // Create and mount card element
        cardElement = elements.create('payment');
        cardElement.mount('#card-element');
        
        // Handle real-time validation errors
        cardElement.on('change', (event) => {
          setCardError(event.error ? event.error.message : '');
        });
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  });

  /**
   * Handle payment form submission
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setCardError('');
    
    if (!stripe || !elements) {
      setProcessing(false);
      return;
    }
    
    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });
      
      if (submitError) {
        setCardError(submitError.message);
        if (props.onPaymentFailure) props.onPaymentFailure(submitError.message);
      } else {
        setSucceeded(true);
        if (props.onPaymentSuccess) props.onPaymentSuccess();
      }
    } catch (err) {
      setCardError('Payment failed. Please try again.');
      if (props.onPaymentFailure) props.onPaymentFailure(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading()) {
    return <div className="payment-loading">Loading payment form...</div>;
  }

  if (error()) {
    return (
      <div className="payment-container">
        <div className="payment-error">{error()}</div>
        <button onClick={props.onLogout} className="payment-logout-button">
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
      
      <form onSubmit={handleSubmit} className="payment-form">
        <h3 className="payment-title">Complete Your Payment</h3>
        <p className="payment-subtitle">Upgrade to continue creating unlimited tasks</p>
        
        <div id="card-element" className="payment-element"></div>
        
        {cardError() && <div className="payment-error">{cardError()}</div>}
        
        {succeeded() ? (
          <div className="payment-success">
            Payment successful! You can now create unlimited tasks.
          </div>
        ) : (
          <button
            type="submit"
            disabled={processing()}
            className="payment-submit-button"
          >
            {processing() ? 'Processing...' : 'Pay $1.00'}
          </button>
        )}
      </form>
      
      <button onClick={props.onLogout} className="payment-logout-button">
        Logout
      </button>
    </div>
  );
}

export default Payment;
