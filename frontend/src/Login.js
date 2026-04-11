import React, { useState } from "react";

function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth failed");
      onAuth(data); // Pass user data up
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="la-title">DID YOU DO IT YET?</h2>
      <h4 className="lf-title">{mode === "login" ? "Login" : "Register"}</h4>
      <form
      className="log-form"
      onSubmit={handleSubmit}>
        <input
          id="e-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          id="p-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit" 
          disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button 
        className="reg-btn"
        onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login"
            ? "Not a member? Register"
            : "Already have an account? Login"}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Login;
