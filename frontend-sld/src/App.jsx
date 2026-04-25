/**
 * @fileoverview Main application component
 * @description Root component that manages authentication state and routes between
 * login and dashboard views. Handles user session management and logout functionality.
 * 
 * @component App
 * @author Generated
 * @since 1.0.0
 */
import { createSignal, onMount } from 'solid-js';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

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
      {/* Conditional rendering: show Login if no user, Dashboard if user exists */}
      {!user() ? (
        // User not authenticated - show login form
        <Login onAuth={handleAuth} />
      ) : (
        // User authenticated - show dashboard with user data and logout handler
        <Dashboard user={user()} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
