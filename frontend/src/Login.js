/**
 * Login/Register Component
 * 
 * This component provides a dual-mode authentication form that can handle
 * both user login and registration. It manages form state, API calls,
 * and error handling for authentication operations.
 * 
 * Props:
 * - onAuth: Function to call with user data on successful authentication
 * 
 * State Management:
 * - mode: Toggles between 'login' and 'register'
 * - email/password: Form input values
 * - error: API error messages
 * - loading: Loading state during API calls
 */

import React, { useState } from "react";

function Login({ onAuth }) {
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI state management
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission for login/registration
   * 
   * This function manages the authentication flow:
   * 1. Prevent default form submission
   * 2. Set loading state and clear errors
   * 3. Make API call based on current mode
   * 4. Handle success/error responses
   * 5. Update parent component with user data
   * 
   * API Call Chain:
   * - Dynamic endpoint: /api/auth/login or /api/auth/register
   * - POST request with JSON body and credentials
   * - Response passed to parent on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Dynamic API call based on mode (login/register)
      // Parameter chain: mode -> API endpoint -> authentication
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include session cookies
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth failed");
      onAuth(data); // Pass user data up to parent component
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render the login/register form
   * 
   * The form dynamically changes based on mode:
   * - Title shows current mode (Login/Register)
   * - Submit button text matches mode
   * - Toggle button switches between modes
   * - Error display only shows when error exists
   */
  return (
    <div className="login-container">
      {/* Application title */}
      <h2 className="la-title">DID YOU DO IT YET?</h2>
      
      {/* Dynamic form title based on mode */}
      <h4 className="lf-title">{mode === "login" ? "Login" : "Register"}</h4>
      
      {/* Authentication form */}
      <form
        className="log-form"
        onSubmit={handleSubmit}>
        {/* Email input field */}
        <input
          id="e-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password input field */}
        <input
          id="p-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* Submit button with loading state */}
        <button
          type="submit" 
          disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      
      {/* Mode toggle button */}
      <button 
        className="reg-btn"
        onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login"
            ? "Not a member? Register"
            : "Already have an account? Login"}
      </button>
      
      {/* Error display - only renders when error exists */}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Login;
