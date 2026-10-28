import { useEffect, useMemo, useState } from "react";
import {
  getTechnicianDistribution,
  markItemReceived,
  markStudentAllReceived,
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

  // Crowd Broadcast State
  const [notificationTitle, setNotificationTitle] = useState("Stationery Collection Update");
  const [notificationMessage, setNotificationMessage] = useState(
    "Please visit the distribution counter during the recommended time to collect your stationery kit.",
  );
  const [timeSlot, setTimeSlot] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");

  const reloadData = async () => {
    try {
      setSaving(true);
      setError("");
      const [distributionData, notificationData] = await Promise.all([
        getTechnicianDistribution(user.email),
        getTechnicianNotifications(user.email),
      ]);
      setDistribution(distributionData);
      setNotifications(notificationData);
    } catch (err) {
      setError(err.message || "Unable to refresh records.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [distributionData, notificationData] = await Promise.all([
          getTechnicianDistribution(user.email),
          getTechnicianNotifications(user.email),
        ]);
        if (!isMounted) return;
        setDistribution(distributionData);
        setNotifications(notificationData);
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to load Technician dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user.email]);

  // Group records by student
  const studentGroups = useMemo(() => {
    const groups = {};
    distribution.forEach((record) => {
      const key = `${record.student}_${record.assignment}`;
      if (!groups[key]) {
        groups[key] = {
          student: record.student,
          studentName: record.studentName,
          studentEmail: record.studentEmail,
          registerNumber: record.registerNumber || "",
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

  const pendingStudents = useMemo(() => {
    return studentGroups.filter((student) =>
      student.items.some((item) => item.status === "Not Collected"),
    );
  }, [studentGroups]);

  const completedStudents = useMemo(() => {
    return studentGroups.filter(
      (student) =>
        student.items.length > 0 &&
        student.items.every((item) => item.status === "Received"),
    );
  }, [studentGroups]);

  const filteredPending = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pendingStudents
      .filter((s) => selectedYear === "all" || Math.ceil(s.semester / 2) === Number(selectedYear))
      .filter((s) => selectedSemester === "all" || s.semester === Number(selectedSemester))
      .filter((s) => !query || s.studentName.toLowerCase().includes(query) || s.studentEmail.toLowerCase().includes(query) || s.registerNumber.toLowerCase().includes(query))
      .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.registerNumber.localeCompare(b.registerNumber));
  }, [pendingStudents, searchQuery, selectedYear, selectedSemester]);

  const semesterOptions = selectedYear === "all" ? [1, 2, 3, 4, 5, 6, 7, 8] : [Number(selectedYear) * 2 - 1, Number(selectedYear) * 2];

  async function handleMarkReceived(distributionId) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await markItemReceived(distributionId, user.email);
      setMessage(
        result.completed
          ? "All stationery for this student has been collected. Student notified."
          : "Item marked as received.",
      );
      await reloadData();
    } catch (err) {
      setError(err.message || "Unable to update distribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAllForStudent(studentId, studentName) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await markStudentAllReceived(studentId, user.email);
      setMessage(
        `${result.message} (${studentName} verified and received full stationery package).`,
      );
      await reloadData();
    } catch (err) {
      setError(err.message || "Unable to complete distribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNotification(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setError("Please enter a title and message.");
      return;
    }

    try {
      setSaving(true);
      const result = await sendTechnicianNotification({
        technicianEmail: user.email,
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        timeSlot: timeSlot.trim(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      setMessage(
        `${result.message} Broadcasted to all ${user.department} students.`,
      );
      await reloadData();
    } catch (err) {
      setError(err.message || "Unable to send alert.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">
            <p className="muted">Loading {user.department} Technician Portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-crest">BIT</div>
          <div className="brand-info">
            <strong>Bannari Amman Institute of Technology</strong>
            <span>Technician Portal | {user.department} Department</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
            <span className="user-role-pill">Technician</span>
          </div>
          <button className="ghost-btn btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        {/* Hero Section */}
        <div className="hero-card">
          <div>
            <p className="eyebrow">Department Distribution Operations</p>
            <h1>{user.department} Stationery Distribution Desk</h1>
          </div>

          <div className="mini-stats">
            <span>{pendingStudents.length} Pending Collection</span>
            <span>{completedStudents.length} Completed Kits</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {/* Live Active Notifications Banner */}
        {notifications.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            {notifications.slice(0, 2).map((n) => (
              <div
                key={n._id}
                className={`crowd-banner ${n.alertLevel === "heavy_crowd" ? "heavy" : n.alertLevel === "moderate" ? "moderate" : "info"}`}
              >
                <div className="crowd-banner-content">
                  <div className="crowd-indicator-dot" />
                  <div className="crowd-text">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                  </div>
                </div>
                {n.timeSlot && <span className="crowd-time-pill">â° Slot: {n.timeSlot}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === "pending" ? "tab active" : "tab"}
            onClick={() => setActiveTab("pending")}
          >
            Pending Students ({pendingStudents.length})
          </button>
          <button
            className={activeTab === "crowd" ? "tab active" : "tab"}
            onClick={() => setActiveTab("crowd")}
          >
            Broadcast Crowd Alert
          </button>
          <button
            className={activeTab === "completed" ? "tab active" : "tab"}
            onClick={() => setActiveTab("completed")}
          >
            Completed Records ({completedStudents.length})
          </button>
        </div>

        {/* TAB 1: PENDING STUDENTS & SEARCH */}
        {activeTab === "pending" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Student Collection Queue</h2>
                <p>Filter by year or semester, then find students alphabetically with their register number and kit items.</p>
              </div>
              <span className="status pending">{filteredPending.length} in queue</span>
            </div>

            {/* Search Bar */}
            <div className="search-filter-bar collection-filters">
              <select aria-label="Filter by year" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedSemester("all"); }}>
                <option value="all">All years</option>
                {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
              </select>
              <select aria-label="Filter by semester" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="all">All semesters</option>
                {semesterOptions.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
              </select>
              <div className="search-input-wrap">
                <span className="search-icon">Search</span>
                <input
                  type="text"
                  placeholder="Search name, register number or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="empty-card">
                {searchQuery
                  ? "No matching pending students found."
                  : "All students in your department have collected their stationery!"}
              </div>
            ) : (
              <div className="collection-table-wrap">
                <table className="collection-table">
                  <thead><tr><th>Student</th><th>Register No.</th><th>Semester / Year</th><th>Kit items</th><th>Action</th></tr></thead>
                  <tbody>{filteredPending.map((student) => (
                    <tr key={`${student.student}_${student.assignment}`}>
                      <td><strong>{student.studentName}</strong><small>{student.studentEmail}</small></td>
                      <td>{student.registerNumber || "-"}</td>
                      <td>Sem {student.semester} / Year {Math.ceil(student.semester / 2)}<small>{student.academicYear}</small></td>
                      <td><div className="collection-item-list">{student.items.map((item) => <div key={item._id}><span>{item.item.name} <strong>x {item.item.quantity}</strong></span>{item.status === "Received" ? <span className="status success">Collected</span> : <button className="secondary-btn btn-sm" disabled={saving} onClick={() => handleMarkReceived(item._id)}>Mark Received</button>}</div>)}</div></td>
                      <td><button className="primary-btn btn-sm" disabled={saving} onClick={() => handleMarkAllForStudent(student.student, student.studentName)}>Mark Full Kit Collected</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BROADCAST CROWD ALERT */}
        {activeTab === "crowd" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Broadcast Department Crowd Alert & Collection Timings</h2>
                <p>
                  Alert students if the distribution desk is crowded and specify a time slot to come.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendNotification}>
              <div className="form-grid">
                <div>
                  <label>Notification Headline</label>
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="e.g. Heavy Crowd â€” Please Visit in Afternoon"
                  />
                </div>

                <div>
                  <label>Recommended Time Window</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="e.g. 2:30 PM - 4:00 PM"
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label>Detailed Message for Students</label>
                <textarea
                  rows="3"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Explain collection location, queue instructions, or slot breakdown..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Publishing..." : "Broadcast Alert to Students"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: COMPLETED RECORDS */}
        {activeTab === "completed" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Completed Student Collections</h2>
                <p>Students who have collected their complete college kit.</p>
              </div>
              <span className="status success">{completedStudents.length} Handed Over</span>
            </div>

            {completedStudents.length === 0 ? (
              <div className="empty-card">No completed student records yet.</div>
            ) : (
              completedStudents.map((student) => (
                <div
                  key={`${student.student}_${student.assignment}_completed`}
                  className="distribution-row"
                >
                  <div>
                    <strong>{student.studentName}</strong>
                    <p className="muted">
                      {student.studentEmail} | Semester {student.semester} | All {student.items.length} items handed over
                    </p>
                  </div>

                  <span className="status success">Completed</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TechnicianDashboard;
