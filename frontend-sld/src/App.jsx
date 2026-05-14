/**
 * @fileoverview Main application component
 * @description Root component that manages authentication state and routes between
 * login and dashboard views. Handles user session management and logout functionality.
 * 
 * @component App
 * @author Generated
 * @since 1.0.0
 */
import { createSignal, onMount, createEffect } from 'solid-js';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Payment from './components/Payment';

/**
 * Main App component - Application root
 * 
 * Manages global authentication state and determines which view to render
 * based on user authentication status. Provides authentication callbacks
 * to child components.
 * 
 * @returns {JSX.Element} Rendered application with conditional routing
 */
function App() {
  // Global user authentication state
  const [user, setUser] = createSignal(null);  // null = not logged in, object = logged in user data
  
  // Payment status state
  const [paymentStatus, setPaymentStatus] = createSignal({
    paymentStatus: 'free',
    tasksCreated: 0,
    freeTasksRemaining: 3,
    isPaywalled: false,
  });
  
  // State to control whether to show payment page
  const [showPayment, setShowPayment] = createSignal(false);

  onMount(async () => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Not authenticated');

    const userData = await response.json();
    setUser(userData);
  } catch {
    setUser(null);
  }
});

  /**
   * Fetch payment status when user changes
   */
  createEffect(async () => {
  const currentUser = user();
  if (!currentUser) return;

  try {
    const response = await fetch('/api/payment/status', {
      credentials: 'include',
    });

    const data = await response.json();
    setPaymentStatus(data);
    setShowPayment(data.isPaywalled);
  } catch {
    setPaymentStatus({
      paymentStatus: 'free',
      tasksCreated: 0,
      freeTasksRemaining: 3,
      isPaywalled: false,
    });
  }
});

  /**
   * Handles user logout by calling the logout API endpoint
   * 
   * Sends a POST request to invalidate the user session on the server
   * and clears the local user state to redirect to login view.
   * 
   * @async
   * @function handleLogout
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    // Call server-side logout endpoint to clear session cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',  // Include authentication cookies
    });
    // Clear local user state to trigger re-render to login view
    setUser(null);
    setShowPayment(false);
  };

  /**
   * Handle payment success
   * 
   * This function is called when payment succeeds.
   * It refreshes the payment status and hides the payment page.
   */
  const handlePaymentSuccess = async () => {
  try {
    const res = await fetch("/api/payment/status", {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch payment status");
    }

    const data = await res.json();

    setPaymentStatus(data);

    // Only close the payment screen if the backend confirms
    // the user is no longer paywalled.
    if (!data.isPaywalled) {
      setShowPayment(false);
    } else {
      setShowPayment(true);
    }
  } catch (err) {
    console.error("Failed to refresh payment status:", err);
  }
};

  /**
   * Handle payment failure
   * 
   * This function is called when payment fails.
   * It keeps the payment page visible so the user can try again.
   */
  const handlePaymentFailure = (errorMessage) => {
    console.error('Payment failed:', errorMessage);
    // Keep payment page visible for retry
  };

  /**
   * Handles successful authentication by setting user state
   * 
   * Called by Login component when authentication succeeds.
   * Sets the global user state which triggers re-render to dashboard view.
   * 
   * @function handleAuth
   * @param {Object} userData - User data returned from authentication API
   * @param {string} userData.email - User email address
   * @param {number} userData.id - User ID
   * @returns {void}
   */
  const handleAuth = (userData) => {
    setUser(userData);  // Set global user state
  };

  // Render application with conditional routing based on authentication state
  return (
    <div className="App">
      {/* Conditional rendering: show Login if no user, Payment if paywalled, Dashboard otherwise */}
      {!user() ? (
        // User not authenticated - show login form
        <Login onAuth={handleAuth} />
      ) : showPayment() ? (
        // User authenticated but paywalled - show payment page
        <Payment 
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onLogout={handleLogout}
        />
      ) : (
        // User authenticated and not paywalled - show dashboard
        <Dashboard user={user()} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
