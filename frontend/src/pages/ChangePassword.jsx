import { useState } from "react";
import { changePassword } from "../api";

function ChangePassword({ user, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your temporary password.");
      return;
    }

    try {
      setLoading(true);

      const result = await changePassword(
        user._id || user.id,
        currentPassword,
        newPassword,
      );

      const updatedUser = result.user || {
        ...user,
        mustChangePassword: false,
      };

      updatedUser.mustChangePassword = false;

      setSuccess("Password changed successfully.");

      setTimeout(() => {
        onPasswordChanged(updatedUser);
      }, 700);
    } catch (error) {
      setError(error.message || "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-mark">BIT</div>

        <div>
          <h1>BIT Stationery Portal</h1>

          <p>Secure Account Setup</p>
        </div>
      </div>

      <div className="login-card">
        <p className="eyebrow">FIRST LOGIN</p>

        <h2>Change your password</h2>

        <p className="muted">
          Your account was created with a temporary password. You must create
          your own password before accessing the dashboard.
        </p>

        <div className="info-box">
          You are logged in as <strong>{user.name}</strong>.
        </div>

        <form onSubmit={handleSubmit}>
          <label>Temporary Password</label>

          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter temporary password"
            autoComplete="current-password"
          />

          <label>New Password</label>

          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Create your password"
            autoComplete="new-password"
          />

          <label>Confirm New Password</label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />

          {error && <div className="error-box">{error}</div>}

          {success && <div className="success-box">{success}</div>}

          <div
            style={{
              marginTop: "22px",
            }}
          >
            <button
              type="submit"
              className="primary-btn full"
              disabled={loading}
            >
              {loading ? "Updating Password..." : "Set New Password"}
            </button>
          </div>
        </form>

        <div className="login-test-info">
          <strong>Password requirements</strong>

          <p>• Minimum 6 characters</p>

          <p>• New password cannot be the temporary password</p>

          <p>• You must complete this step before accessing your dashboard</p>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
