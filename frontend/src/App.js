import React, { useState } from "react";
import Login from "./Login";

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <div className="App">
      {!user ? (
        <Login onAuth={setUser} />
      ) : (
        <div>
          <h2>Welcome, {user.email}!</h2>
          <button onClick={handleLogout}>Logout</button>
          {/* Dashboard and logout button will go here */}
        </div>
      )}
    </div>
  );
}

export default App;
