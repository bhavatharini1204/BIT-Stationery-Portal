import { useEffect, useMemo, useState } from "react";

import {
  getTechnicianDistribution,
  markItemReceived,
  sendTechnicianNotification,
  getTechnicianNotifications,
} from "../api";

function TechnicianDashboard({ user, onLogout }) {
  const [distribution, setDistribution] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [notificationTitle, setNotificationTitle] = useState("");

  const [notificationMessage, setNotificationMessage] = useState("");

  const [notificationExpiry, setNotificationExpiry] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [distributionData, notificationData] = await Promise.all([
        getTechnicianDistribution(user.email),

        getTechnicianNotifications(user.email),
      ]);

      setDistribution(distributionData);

      setNotifications(notificationData);
    } catch (error) {
      setError(error.message || "Unable to load Technician dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user.email]);

  /*
   * Group records by student + assignment.
   */

  const studentGroups = useMemo(() => {
    const groups = {};

    distribution.forEach((record) => {
      const key = `${record.student}_${record.assignment}`;

      if (!groups[key]) {
        groups[key] = {
          student: record.student,

          studentName: record.studentName,

          studentEmail: record.studentEmail,

          department: record.department,

          semester: record.semester,

          academicYear: record.academicYear,

          assignment: record.assignment,

          items: [],
        };
      }

      groups[key].items.push(record);
    });

    return Object.values(groups);
  }, [distribution]);

  const pendingStudents = studentGroups.filter((student) =>
    student.items.some((item) => item.status === "Not Collected"),
  );

  const completedStudents = studentGroups.filter(
    (student) =>
      student.items.length > 0 &&
      student.items.every((item) => item.status === "Received"),
  );

  async function handleMarkReceived(distributionId) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await markItemReceived(distributionId, user.email);

      setMessage(
        result.completed
          ? "All stationery for this student has been received. The student has been notified."
          : "Item marked as received.",
      );

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to update distribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNotification(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !notificationTitle.trim() ||
      !notificationMessage.trim() ||
      !notificationExpiry
    ) {
      setError("Enter title, message and expiry time.");
      return;
    }

    try {
      setSaving(true);

      const result = await sendTechnicianNotification({
        technicianEmail: user.email,

        title: notificationTitle.trim(),

        message: notificationMessage.trim(),

        expiresAt: new Date(notificationExpiry).toISOString(),
      });

      setMessage(result.message);

      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationExpiry("");

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to send notification.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">Loading Technician dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* TOP BAR */}

      <div className="topbar">
        <strong>BIT Stationery Portal</strong>

        <div className="top-actions">
          <span>{user.name}</span>

          <span>Technician • {user.department}</span>

          <button className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container">
        {/* HERO */}

        <div className="hero-card">
          <div>
            <p className="eyebrow">DEPARTMENT DISTRIBUTION</p>

            <h1>{user.department} Technician</h1>

            <p className="muted">
              Manage stationery collection for {user.department} students.
            </p>
          </div>

          <div className="mini-stats">
            <span>{pendingStudents.length} Pending</span>

            <span>{completedStudents.length} Completed</span>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="error-box">{error}</div>}

        {/* SUCCESS MESSAGE */}

        {message && <div className="info-box">{message}</div>}

        {/* =====================================
            SEND DEPARTMENT MESSAGE
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Department Notification</h2>

              <p className="muted">
                Send a temporary message to students in {user.department}.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification}>
            <div className="form-grid">
              <div>
                <label>Notification Title</label>

                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(event) => setNotificationTitle(event.target.value)}
                  placeholder="Example: Distribution postponed"
                />
              </div>

              <div>
                <label>Expiry Time</label>

                <input
                  type="datetime-local"
                  value={notificationExpiry}
                  onChange={(event) =>
                    setNotificationExpiry(event.target.value)
                  }
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label>Message</label>

              <textarea
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                placeholder="Example: Distribution is temporarily paused due to high crowd. Please come after 2:30 PM."
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "9px",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Sending..." : "Publish Notification"}
              </button>
            </div>
          </form>
        </div>

        {/* ACTIVE NOTIFICATIONS */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Active Notifications</h2>

              <p className="muted">
                Messages currently visible to your department students.
              </p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-card">
              No active department notifications.
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification._id} className="info-box">
                <strong>{notification.title}</strong>

                <p>{notification.message}</p>

                <small>
                  Expires: {new Date(notification.expiresAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>

        {/* =====================================
            PENDING STUDENTS
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Students Pending Collection</h2>

              <p className="muted">
                Only students from your department are shown here.
              </p>
            </div>

            <span className="status pending">
              {pendingStudents.length} Pending
            </span>
          </div>

          {pendingStudents.length === 0 ? (
            <div className="empty-card">No students are currently pending.</div>
          ) : (
            pendingStudents.map((student) => (
              <div
                key={`${student.student}_${student.assignment}`}
                className="panel"
                style={{
                  marginBottom: "15px",
                  background: "#f8fafc",
                }}
              >
                <div className="section-heading">
                  <div>
                    <h3>{student.studentName}</h3>

                    <p className="muted">
                      {student.studentEmail}
                      {" • "}
                      Semester {student.semester}
                      {" • "}
                      {student.academicYear}
                    </p>
                  </div>

                  <span className="status pending">Pending</span>
                </div>

                {student.items.map((item) => (
                  <div key={item._id} className="distribution-row">
                    <div>
                      <strong>{item.item.name}</strong>

                      <p className="muted">Quantity: {item.item.quantity}</p>
                    </div>

                    <div className="row-actions">
                      {item.status === "Received" ? (
                        <span className="status success">Received</span>
                      ) : (
                        <button
                          className="primary-btn"
                          disabled={saving}
                          onClick={() => handleMarkReceived(item._id)}
                        >
                          Mark Received
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* =====================================
            COMPLETED STUDENTS
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Completed Students</h2>

              <p className="muted">
                Students whose complete stationery allotment has been received.
              </p>
            </div>

            <span className="status success">
              {completedStudents.length} Completed
            </span>
          </div>

          {completedStudents.length === 0 ? (
            <div className="empty-card">No completed students yet.</div>
          ) : (
            completedStudents.map((student) => (
              <div
                key={`${student.student}_${student.assignment}_completed`}
                className="distribution-row"
              >
                <div>
                  <strong>{student.studentName}</strong>

                  <p className="muted">
                    {student.studentEmail}
                    {" • "}
                    Semester {student.semester}
                  </p>
                </div>

                <span className="status success">All Received</span>
              </div>
            ))
          )}
        </div>

        {/* ACCESS RULE */}

        <div className="panel">
          <div className="info-box">
            <strong>Technician access</strong>

            <p>
              You can only view and update distribution records belonging to the{" "}
              {user.department} department. Students from other departments are
              not accessible.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TechnicianDashboard;
