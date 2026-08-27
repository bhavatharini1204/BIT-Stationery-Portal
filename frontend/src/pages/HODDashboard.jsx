import { useEffect, useState } from "react";

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

  const [semester, setSemester] = useState(user.semester || 1);

  const [academicYear, setAcademicYear] = useState("2026-27");

  const [selectedItems, setSelectedItems] = useState({});

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [productData, assignmentData, studentData, distributionData] =
        await Promise.all([
          getStationery(),
          getHODAssignments(user.email),
          getHODStudents(user.email),
          getHODDistribution(user.email),
        ]);

      setProducts(
        productData.filter((product) => product.source === "college"),
      );

      setAssignments(assignmentData);

      setStudents(studentData);

      setDistribution(distributionData);
    } catch (error) {
      setError(error.message || "Unable to load HOD dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user.email]);

  function handleQuantityChange(productId, value) {
    const quantity = Number(value);

    setSelectedItems((current) => {
      const updated = {
        ...current,
      };

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
      setError("Select at least one college stationery item.");
      return;
    }

    const items = selectedProductIds.map((productId) => {
      const product = products.find((item) => item._id === productId);

      return {
        stationeryId: productId,
        quantity: selectedItems[productId],
      };
    });

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

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to create assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize(assignmentId) {
    const confirmed = window.confirm(
      "Finalize this assignment? Once finalized, it will create distribution records for all students in this department and semester.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await finalizeAssignment(assignmentId, user.email);

      setMessage(
        `${result.message} ${result.studentCount} students assigned to ${result.technician.name}.`,
      );

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to finalize assignment.");
    } finally {
      setSaving(false);
    }
  }

  function getStudentStatus(studentId) {
    const studentRecords = distribution.filter(
      (record) => String(record.student) === String(studentId),
    );

    if (studentRecords.length === 0) {
      return "Not Assigned";
    }

    const allReceived = studentRecords.every(
      (record) => record.status === "Received",
    );

    return allReceived ? "Received" : "Pending";
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">Loading HOD dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <strong>BIT Stationery Portal</strong>

        <div className="top-actions">
          <span>{user.name}</span>

          <span>HOD • {user.department}</span>

          <button className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container">
        {/* HERO */}

        <div className="hero-card">
          <div>
            <p className="eyebrow">DEPARTMENT MANAGEMENT</p>

            <h1>{user.department} HOD Dashboard</h1>

            <p className="muted">
              Manage semester stationery allotments and monitor distribution.
            </p>
          </div>

          <div className="mini-stats">
            <span>{students.length} Students</span>

            <span>{assignments.length} Assignments</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {message && <div className="info-box">{message}</div>}

        {/* CREATE ALLOTMENT */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Create Semester Allotment</h2>

              <p className="muted">
                Decide what stationery should be provided to students in your
                department.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAssignment}>
            <div className="form-grid">
              <div>
                <label>Semester</label>

                <select
                  value={semester}
                  onChange={(event) => setSemester(event.target.value)}
                >
                  <option value="1">Semester 1</option>

                  <option value="2">Semester 2</option>

                  <option value="3">Semester 3</option>

                  <option value="4">Semester 4</option>

                  <option value="5">Semester 5</option>

                  <option value="6">Semester 6</option>

                  <option value="7">Semester 7</option>

                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div>
                <label>Academic Year</label>

                <input
                  type="text"
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  placeholder="2026-27"
                />
              </div>
            </div>

            <h3 className="subheading">College Stationery</h3>

            {products.length === 0 ? (
              <div className="empty-card">
                No college stationery is currently available.
              </div>
            ) : (
              <div className="selection-list">
                {products.map((product) => (
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
                        {product.category}
                        {" • "}
                        Available stock: {product.stock}
                      </p>
                    </div>

                    <input
                      className="quantity-input"
                      type="number"
                      min="0"
                      max={product.stock}
                      placeholder="Qty"
                      value={selectedItems[product._id] || ""}
                      onChange={(event) =>
                        handleQuantityChange(product._id, event.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Creating..." : "Create Allotment"}
              </button>
            </div>
          </form>
        </div>

        {/* ASSIGNMENTS */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Semester Allotments</h2>

              <p className="muted">
                Review and finalize your department's allotments.
              </p>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="empty-card">No allotments created yet.</div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment._id} className="distribution-row">
                <div>
                  <strong>
                    Semester {assignment.semester}
                    {" • "}
                    {assignment.academicYear}
                  </strong>

                  <p className="muted">
                    {assignment.items
                      .map((item) => `${item.name} × ${item.quantity}`)
                      .join(" • ")}
                  </p>

                  <p className="muted">
                    Created:{" "}
                    {new Date(assignment.createdAt).toLocaleDateString()}
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
                      className="primary-btn"
                      disabled={saving}
                      onClick={() => handleFinalize(assignment._id)}
                    >
                      Finalize
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* STUDENT MONITORING */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Department Students</h2>

              <p className="muted">
                Students who have and have not received their assigned
                stationery.
              </p>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="empty-card">
              No students found in this department.
            </div>
          ) : (
            students.map((student) => {
              const status = getStudentStatus(student._id);

              return (
                <div key={student._id} className="distribution-row">
                  <div>
                    <strong>{student.name}</strong>

                    <p className="muted">
                      {student.registerNumber}
                      {" • "}
                      Semester {student.semester}
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
                    {status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* IMPORTANT NOTE */}

        <div className="panel">
          <div className="info-box">
            <strong>HOD access rule</strong>

            <p>
              You can create and finalize allotments and monitor your
              department's students. Only the department Technician can mark
              stationery as received.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HODDashboard;
