import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function MentorDashboard() {
  const user = JSON.parse(localStorage.getItem("bitUser") || "{}");

  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const data = await apiRequest(
        `/api/distribution/mentor/${encodeURIComponent(user.email)}`,
      );

      setStudents(data.students || []);
      setDistributions(data.distributions || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.email || user.role !== "mentor") {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  const logout = () => {
    localStorage.removeItem("bitUser");
    navigate("/");
  };

  const receivedCount = distributions.filter(
    (item) => item.status === "Received",
  ).length;

  const pendingCount = distributions.filter(
    (item) => item.status === "Not Collected",
  ).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>BIT Stationery Portal</strong>

        <div className="top-actions">
          <span>{user.name}</span>

          <button className="ghost-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        <section className="hero-card">
          <div>
            <p className="eyebrow">MENTOR WORKSPACE</p>

            <h1>Mentee Distribution Tracking</h1>

            <p className="muted">
              Check whether your mentees have received the stationery provided
              by the college.
            </p>
          </div>

          <div className="mini-stats">
            <span>Mentees: {students.length}</span>

            <span>Pending: {pendingCount}</span>

            <span>Received: {receivedCount}</span>
          </div>
        </section>

        {message && <div className="info-box">{message}</div>}

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MY MENTEES</p>

              <h2>Student Collection Status</h2>

              <p className="muted">
                Monitoring only. The mentor does not handle store purchases.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="muted">Loading mentee records...</p>
          ) : students.length === 0 ? (
            <div className="empty-card">
              No mentees are currently assigned to this mentor.
            </div>
          ) : (
            students.map((student) => {
              const studentRecords = distributions.filter(
                (record) => record.studentEmail === student.email,
              );

              const received = studentRecords.filter(
                (record) => record.status === "Received",
              ).length;

              const total = studentRecords.length;

              return (
                <div className="distribution-row" key={student.email}>
                  <div>
                    <strong>{student.name}</strong>

                    <p className="muted">{student.email}</p>

                    <p>
                      Semester {student.semester}
                      {" · "}
                      {student.department}
                    </p>

                    {studentRecords.length > 0 && (
                      <div>
                        {studentRecords.map((record) => (
                          <p className="muted" key={record._id}>
                            {record.item.name}
                            {" × "}
                            {record.item.quantity}
                            {" — "}
                            {record.status}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="row-actions">
                    <span
                      className={
                        total > 0 && received === total
                          ? "status success"
                          : "status pending"
                      }
                    >
                      {total === 0
                        ? "No allocation"
                        : `${received}/${total} received`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default MentorDashboard;
