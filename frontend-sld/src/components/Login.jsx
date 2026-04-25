/**
 * @fileoverview Login component for user authentication
 * @description Handles user login and registration functionality with form validation
 * and error handling. Supports mode switching between login and registration.
 * 
 * @component Login
 * @param {Object} props - Component props
 * @param {Function} props.onAuth - Callback function to handle successful authentication
 * 
 * @author Generated
 * @since 1.0.0
 */
import { createSignal } from 'solid-js';

/**
 * Login component - Authentication interface
 * 
 * Provides dual functionality for user login and registration.
 * Features form validation, loading states, and error handling.
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onAuth - Function to call with user data on successful auth
 * @returns {JSX.Element} Rendered login component
 */
function Login(props) {
  // Reactive state signals for form and authentication management
  const [email, setEmail] = createSignal('');           // User email input
  const [password, setPassword] = createSignal('');     // User password input
  const [mode, setMode] = createSignal('login');         // Auth mode: 'login' or 'register'
  const [error, setError] = createSignal('');            // Error message display
  const [loading, setLoading] = createSignal(false);    // Loading state for async operations

  /**
   * Handles form submission for both login and registration
   * 
   * Sends authentication request to appropriate API endpoint based on mode.
   * Includes loading states, error handling, and success callbacks.
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent default form submission
    setLoading(true);     // Show loading state
    setError('');         // Clear any existing errors
    
    try {
      // Send request to appropriate endpoint based on current mode
      const response = await fetch(`/api/auth/${mode()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Include authentication cookies
        body: JSON.stringify({ 
          email: email(), 
          password: password() 
        }),
      });
      
      const data = await response.json();
      
      // Handle authentication errors
      if (!response.ok) {
        throw new Error(data.error || 'Auth failed');
      }
      
      // Success: pass user data to parent component
      props.onAuth(data);
    } catch (err) {
      // Display error message to user
      setError(err.message);
    } finally {
      // Always stop loading state
      setLoading(false);
    }
  };

  /**
   * Toggles between login and registration modes
   * 
   * Switches the authentication mode and clears any existing errors.
   * Provides seamless transition between login and registration forms.
   * 
   * @function toggleMode
   * @returns {void}
   */
  const toggleMode = () => {
    // Switch between 'login' and 'register' modes
    setMode(mode() === 'login' ? 'register' : 'login');
    setError('');  // Clear errors when switching modes
  };

  // Render the authentication interface
  return (
    <div className="login-container">
      {/* Application title */}
      <h2 className="la-title">DID YOU DO IT YET?</h2>
      {/* Dynamic form title based on current mode */}
      <h4 className="lf-title">{mode() === 'login' ? 'Login' : 'Register'}</h4>
      
      {/* Authentication form */}
      <form className="log-form" onSubmit={handleSubmit}>
        <input
          id="e-input"  // Unique ID for styling/accessibility
          type="email"  // HTML5 email validation
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail(e.target.value)}
          required
        />

        <input
          id="p-input"  // Unique ID for styling/accessibility
          type="password"  // Secure password input
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* Submit button with loading state */}
        <button type="submit" disabled={loading()}>
          {loading() ? 'Please wait...' : (mode() === 'login' ? 'Login' : 'Register')}
        </button>
      </form>
      
      {/* Mode toggle button */}
      <button className="reg-btn" onClick={toggleMode}>
        {mode() === 'login'
          ? 'Not a member? Register'
          : 'Already have an account? Login'}
      </button>
      
      {/* Error message display */}
      {error() && <div className="error">{error()}</div>}
    </div>
  );
}

export default Login;
