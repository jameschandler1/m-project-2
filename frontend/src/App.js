/**
 * Main Application Component
 * 
 * This is the root component of the React application that manages
 * authentication state and renders either the Login or Dashboard
 * component based on whether a user is authenticated.
 * 
 * Authentication Flow:
 * 1. App starts with user state as null
 * 2. Login component handles authentication and calls onAuth with user data
 * 3. Dashboard component is rendered when user is authenticated
 * 4. handleLogout clears user session and state
 */

import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Payment from "./Payment";

function App() {
  // State management for user authentication
  // user: null (not logged in) or user object (logged in)
  const [user, setUser] = useState(null);
  
  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState({
    paymentStatus: 'free',
    tasksCreated: 0,
    freeTasksRemaining: 3,
    isPaywalled: false,
  });
  
  // State to control whether to show payment page
  const [showPayment, setShowPayment] = useState(false);

   useEffect(() => {
  fetch("/api/auth/me", {
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      return res.json();
    })
    .then((userData) => {
      setUser(userData);
    })
    .catch(() => {
      setUser(null);
    });
}, []); 

  const refreshPaymentStatus = () => {
  fetch("/api/payment/status", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      setPaymentStatus(data);

      if (data.isPaywalled) {
        setShowPayment(true);
      } else {
        setShowPayment(false);
      }
    })
    .catch(() => {
      setPaymentStatus({
        paymentStatus: "free",
        tasksCreated: 0,
        freeTasksRemaining: 3,
        isPaywalled: false,
      });
      setShowPayment(false);
    });
};

 

  /**
   * Fetch payment status when user changes
   */
  useEffect(() => {
  if (user) {
    refreshPaymentStatus();
  }
}, [user]);

  /**
   * Handle user logout
   * 
   * This function calls the logout API endpoint and clears the
   * user state, which causes the app to render the Login component.
   * 
   * API Call Chain:
   * - POST /api/auth/logout with credentials
   * - Clear user state on success
   */
  const handleLogout = async () => {
    // Call logout endpoint with session cookies
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // Include session cookies
    });
    // Clear user state to trigger Login component render
    setUser(null);
    setShowPayment(false);
  };

  /**
   * Handle payment success
   * 
   * This function is called when payment succeeds.
   * It refreshes the payment status and hides the payment page.
   */
  const handlePaymentSuccess = () => {
  fetch("/api/payment/status", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      setPaymentStatus(data);

      // Only hide payment screen if user is truly paid
      if (!data.isPaywalled) {
        setShowPayment(false);
      } else {
        setShowPayment(true);
      }
    })
    .catch((err) => {
      console.error("Failed to refresh payment status:", err);
    });
};

  /**
   * Handle payment failure
   * 
   * This function is called when payment fails.
   * It keeps the payment page visible so the user can try again.
   */
  const handlePaymentFailure = (errorMessage) => {
    console.error("Payment failed:", errorMessage);
    // Keep payment page visible for retry
  };

  /**
   * Render logic based on authentication state
   * 
   * Conditional rendering flow:
   * - If user is null: Show Login component
   * - If user exists and paywalled: Show Payment component
   * - If user exists and not paywalled: Show Dashboard component
   */
  return (
    <div className="App">
      {!user ? (
        // User not authenticated - show login form
        <Login onAuth={setUser} />
      ) : showPayment ? (
        // User authenticated but paywalled - show payment page
        <Payment 
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onLogout={handleLogout}
        />
      ) : (
        // User authenticated and not paywalled - show dashboard
        <Dashboard
  user={user}
  onLogout={handleLogout}
  paymentStatus={paymentStatus}
  onTaskCreated={refreshPaymentStatus}
/>
      )}
    </div>
  );
}

export default App;
