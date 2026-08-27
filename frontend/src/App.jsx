import { useEffect, useState } from "react";

import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

import StudentDashboard from "./pages/StudentDashboard";
import HODDashboard from "./pages/HODDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import StorepersonDashboard from "./pages/StorepersonDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);

  /* =========================================
     LOAD SAVED USER
  ========================================= */

  useEffect(() => {
    const savedUser = localStorage.getItem("stationeryUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("stationeryUser");
      }
    }
  }, []);

  /* =========================================
     LOGIN
  ========================================= */

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);

    localStorage.setItem("stationeryUser", JSON.stringify(loggedInUser));
  }

  /* =========================================
     PASSWORD CHANGED
  ========================================= */

  function handlePasswordChanged(updatedUser) {
    const finalUser = {
      ...user,
      ...updatedUser,
      mustChangePassword: false,
    };

    setUser(finalUser);

    localStorage.setItem("stationeryUser", JSON.stringify(finalUser));
  }

  /* =========================================
     LOGOUT
  ========================================= */

  function handleLogout() {
    setUser(null);

    localStorage.removeItem("stationeryUser");
  }

  /* =========================================
     NOT LOGGED IN
  ========================================= */

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  /* =========================================
     FORCE STAFF PASSWORD CHANGE
  ========================================= */

  if (
    user.role !== "student" &&
    user.role !== "admin" &&
    user.mustChangePassword
  ) {
    return (
      <ChangePassword user={user} onPasswordChanged={handlePasswordChanged} />
    );
  }

  /* =========================================
     ADMIN
  ========================================= */

  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  /* =========================================
     HOD
  ========================================= */

  if (user.role === "hod") {
    return <HODDashboard user={user} onLogout={handleLogout} />;
  }

  /* =========================================
     TECHNICIAN
  ========================================= */

  if (user.role === "technician") {
    return <TechnicianDashboard user={user} onLogout={handleLogout} />;
  }

  /* =========================================
     STOREPERSON
  ========================================= */

  if (user.role === "storeperson") {
    return <StorepersonDashboard user={user} onLogout={handleLogout} />;
  }

  /* =========================================
     STUDENT
  ========================================= */

  if (user.role === "student") {
    return <StudentDashboard user={user} onLogout={handleLogout} />;
  }

  /* =========================================
     UNKNOWN ROLE
  ========================================= */

  return (
    <div className="app-shell">
      <div className="container">
        <div className="error-box">
          <strong>Invalid account role</strong>

          <p>Your account does not have a valid portal role.</p>

          <button className="primary-btn" onClick={handleLogout}>
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
