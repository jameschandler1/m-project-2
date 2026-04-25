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

import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  // State management for user authentication
  // user: null (not logged in) or user object (logged in)
  const [user, setUser] = useState(null);

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
  };

  /**
   * Render logic based on authentication state
   * 
   * Conditional rendering flow:
   * - If user is null: Show Login component
   * - If user exists: Show Dashboard component with user data and logout handler
   */
  return (
    <div className="App">
      {!user ? (
        // User not authenticated - show login form
        <Login onAuth={setUser} />
      ) : (
        // User authenticated - show dashboard with user data and logout capability
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
