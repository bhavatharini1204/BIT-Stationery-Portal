import { useEffect, useState, useMemo } from "react";
import {
  getStationery,
  createAssignment,
  getHODAssignments,
  finalizeAssignment,
  getHODStudents,
  getHODDistribution,
} from "../api";

function HODDashboard({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [distribution, setDistribution] = useState([]);

  // Year & Semester Selection (4 Years, 8 Semesters)
  const [selectedYear, setSelectedYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [progressYear, setProgressYear] = useState(1);
  const [progressSemester, setProgressSemester] = useState("all");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [selectedItems, setSelectedItems] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("allotment");

  // Keep semester in sync when year tab is chosen
  function handleYearChange(yearNum) {
    setSelectedYear(yearNum);
    // default to the odd semester of that year
    const defaultSem = (yearNum - 1) * 2 + 1;
    setSemester(defaultSem);
  }

  const reloadData = async () => {
    try {
      setSaving(true);
      setError("");
      const [productData, assignmentData, studentData, distributionData] =
        await Promise.all([
          getStationery(),
          getHODAssignments(user.email),
          getHODStudents(user.email),
          getHODDistribution(user.email),
        ]);
      setProducts(productData.filter((p) => p.source === "college"));
      setAssignments(assignmentData);
      setStudents(studentData);
      setDistribution(distributionData);
    } catch (err) {
      setError(err.message || "Unable to refresh data.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initDashboard() {
      try {
        const [productData, assignmentData, studentData, distributionData] =
          await Promise.all([
            getStationery(),
            getHODAssignments(user.email),
            getHODStudents(user.email),
            getHODDistribution(user.email),
          ]);
        if (!isMounted) return;
        setProducts(productData.filter((p) => p.source === "college"));
        setAssignments(assignmentData);
        setStudents(studentData);
        setDistribution(distributionData);
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to load HOD dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initDashboard();
    return () => {
      isMounted = false;
    };
  }, [user.email]);

  function handleQuantityChange(productId, value) {
    const quantity = Number(value);
    setSelectedItems((current) => {
      const updated = { ...current };
      if (!quantity || quantity <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = quantity;
      }
      return updated;
    });
  }

  async function handleCreateAssignment(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const selectedProductIds = Object.keys(selectedItems);
    if (selectedProductIds.length === 0) {
      setError("Please select at least one stationery item for this allotment.");
      return;
    }

    const items = selectedProductIds.map((productId) => ({
      stationeryId: productId,
      quantity: selectedItems[productId],
    }));

    try {
      setSaving(true);
      const result = await createAssignment({
        hodEmail: user.email,
        semester: Number(semester),
        academicYear,
        items,
      });

      setMessage(result.message);
      setSelectedItems({});
      await reloadData();
    } catch (err) {
      setError(err.message || "Unable to create allotment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize(assignmentId) {
    const confirmed = window.confirm(
      "Finalize this allotment? This will lock the quantities, reserve college warehouse stock, and automatically notify both the Storeperson (for dispatch) and your Department Technician (for distribution).",
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await finalizeAssignment(assignmentId, user.email);
      setMessage(
        `${result.message} ${result.studentCount} students allocated. Notified ${result.technician?.name || "Technician"}.`,
      );
      await reloadData();
    } catch (err) {
      setError(err.message || "Unable to finalize allotment.");
    } finally {
      setSaving(false);
    }
  }

  function getStudentStatus(studentId) {
    const studentRecords = distribution.filter(
      (record) => String(record.student) === String(studentId),
    );
    if (studentRecords.length === 0) return "Not Assigned";
    const allReceived = studentRecords.every((r) => r.status === "Received");
    return allReceived ? "Received" : "Pending";
  }

  // Yearly Distribution Metrics
  const yearStats = useMemo(() => {
    return [1, 2, 3, 4].map((yr) => {
      const sems = [yr * 2 - 1, yr * 2];
      const yrStudents = students.filter((s) => sems.includes(Number(s.semester)));
      const completed = yrStudents.filter((s) => {
        const studentRecords = distribution.filter(
          (record) => String(record.student) === String(s._id),
        );
        return (
          studentRecords.length > 0 &&
          studentRecords.every((r) => r.status === "Received")
        );
      }).length;
      return {
        year: yr,
        total: yrStudents.length,
        received: completed,
        pending: yrStudents.length - completed,
      };
    });
  }, [students, distribution]);

  const progressStudents = useMemo(() => {
    const firstSemester = progressYear * 2 - 1;
    return students
      .filter((student) => Number(student.semester) >= firstSemester && Number(student.semester) <= firstSemester + 1)
      .filter((student) => progressSemester === "all" || Number(student.semester) === Number(progressSemester))
      .sort((a, b) => (a.registerNumber || "").localeCompare(b.registerNumber || "") || a.name.localeCompare(b.name));
  }, [students, progressYear, progressSemester]);

  const availableProducts = products.filter((product) => Number(product.stock) > 0);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">
            <p className="muted">Loading {user.department} Department HOD Dashboard...</p>
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
            <span>HOD Portal • {user.department} Department</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
            <span className="user-role-pill">HOD</span>
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
            <p className="eyebrow">Academic Department Oversight</p>
            <h1>{user.department} Stationery Allotment & Distribution</h1>
            <p>
              Allocate standard semester kits for students across 4 academic years.
              Finalized allotments instantly notify the Campus Storeperson and Department Technician.
            </p>
          </div>

          <div className="mini-stats">
            <span>{students.length} Total Students</span>
            <span>{assignments.length} Semester Allotments</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {/* 4-Year Progress Cards */}
        <div className="stats-grid">
          {yearStats.map((st) => (
            <button
              type="button"
              className="stat-card year-stat-card"
              key={st.year}
              onClick={() => {
                setProgressYear(st.year);
                setProgressSemester("all");
                setActiveTab("students");
              }}
            >
              <span>Year {st.year} (Sem {st.year * 2 - 1} & {st.year * 2})</span>
              <strong>{st.received} / {st.total}</strong>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>
                {st.total === 0 ? "No students" : `${st.pending} Pending Collection`}
              </p>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === "allotment" ? "tab active" : "tab"}
            onClick={() => setActiveTab("allotment")}
          >
            Create Allotment
          </button>
          <button
            className={activeTab === "assignments" ? "tab active" : "tab"}
            onClick={() => setActiveTab("assignments")}
          >
            Allotment History ({assignments.length})
          </button>
          <button
            className={activeTab === "students" ? "tab active" : "tab"}
            onClick={() => setActiveTab("students")}
          >
            Student Progress ({students.length})
          </button>
        </div>

        {/* Tab 1: Create Allotment */}
        {activeTab === "allotment" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Allocate College Stationery Kit</h2>
                <p>Select target academic year, semester, and items from the college repository.</p>
              </div>
            </div>

            <form onSubmit={handleCreateAssignment}>
              {/* Year Selector Chips */}
              <label>Select Target Academic Year</label>
              <div className="chip-group">
                {[1, 2, 3, 4].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className={selectedYear === yr ? "chip-btn active" : "chip-btn"}
                    onClick={() => handleYearChange(yr)}
                  >
                    Year {yr}
                  </button>
                ))}
              </div>

              <div className="form-grid">
                <div>
                  <label>Select Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                  >
                    <option value={(selectedYear - 1) * 2 + 1}>
                      Semester {(selectedYear - 1) * 2 + 1} (Odd Semester)
                    </option>
                    <option value={selectedYear * 2}>
                      Semester {selectedYear * 2} (Even Semester)
                    </option>
                  </select>
                </div>

                <div>
                  <label>Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026-27"
                  />
                </div>
              </div>

              <h3 style={{ margin: "24px 0 10px", fontSize: "16px", fontWeight: "800" }}>
                Select Materials & Quantity per Student
              </h3>

              {availableProducts.length === 0 ? (
                <div className="empty-card">
                  No college stationery is currently in stock.
                </div>
              ) : (
                <div className="selection-list">
                  {availableProducts.map((product) => (
                    <div
                      key={product._id}
                      className={
                        selectedItems[product._id]
                          ? "selection-row selected"
                          : "selection-row"
                      }
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <p className="muted">
                          {product.category} • Warehouse Stock: {product.stock} units
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: "var(--bit-slate-600)" }}>
                          Qty/Student:
                        </span>
                        <input
                          className="quantity-input"
                          type="number"
                          min="0"
                          max={product.stock}
                          placeholder="0"
                          value={selectedItems[product._id] || ""}
                          onChange={(e) =>
                            handleQuantityChange(product._id, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || Object.keys(selectedItems).length === 0}
                >
                  {saving ? "Saving Allotment..." : "Save Semester Allotment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Allotments History */}
        {activeTab === "assignments" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Department Allotments</h2>
                <p>Finalized allotments trigger notifications to Storeperson and Technician.</p>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-card">No allotments created yet.</div>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment._id} className="distribution-row">
                  <div>
                    <strong>
                      Semester {assignment.semester} (Year {Math.ceil(assignment.semester / 2)}) • {assignment.academicYear}
                    </strong>
                    <p className="muted">
                      Items:{" "}
                      {assignment.items
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .join(" • ")}
                    </p>
                    <p className="muted">
                      Status:{" "}
                      {assignment.finalized ? (
                        <span style={{ color: "var(--bit-emerald)", fontWeight: "700" }}>
                          Finalized on {new Date(assignment.finalizedAt || assignment.createdAt).toLocaleDateString()}
                          {" — "}
                          {assignment.dispatchStatus || "Dispatched to Department"}
                        </span>
                      ) : (
                        <span style={{ color: "var(--bit-gold)", fontWeight: "700" }}>
                          Draft (Pending Finalization)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="row-actions">
                    <span
                      className={
                        assignment.finalized ? "status success" : "status pending"
                      }
                    >
                      {assignment.finalized ? "Finalized" : "Draft"}
                    </span>

                    {!assignment.finalized && (
                      <button
                        className="primary-btn btn-sm"
                        disabled={saving}
                        onClick={() => handleFinalize(assignment._id)}
                      >
                        Finalize & Notify
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Student Monitoring */}
        {activeTab === "students" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Student Collection Tracking</h2>
                <p>View collection status by year and semester in {user.department}.</p>
              </div>
            </div>

            <div className="progress-filters">
              <label>
                Academic year
                <select value={progressYear} onChange={(event) => { setProgressYear(Number(event.target.value)); setProgressSemester("all"); }}>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </label>
              <label>
                Semester
                <select value={progressSemester} onChange={(event) => setProgressSemester(event.target.value)}>
                  <option value="all">Both semesters</option>
                  {[progressYear * 2 - 1, progressYear * 2].map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </label>
              <span className="muted">{progressStudents.filter((student) => getStudentStatus(student._id) === "Received").length} collected · {progressStudents.filter((student) => getStudentStatus(student._id) !== "Received").length} not collected</span>
            </div>

            {progressStudents.length === 0 ? (
              <div className="empty-card">No active students registered in this department.</div>
            ) : (
              progressStudents.map((student) => {
                const status = getStudentStatus(student._id);
                return (
                  <div key={student._id} className="distribution-row">
                    <div>
                      <strong>{student.name}</strong>
                      <p className="muted">
                        Reg: {student.registerNumber} • Semester {student.semester} (Year {Math.ceil(student.semester / 2)}) • {student.email}
                      </p>
                    </div>

                    <span
                      className={
                        status === "Received"
                          ? "status success"
                          : status === "Pending"
                            ? "status pending"
                            : "status danger"
                      }
                    >
                      {status === "Received" ? "Collected" : status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default HODDashboard;
