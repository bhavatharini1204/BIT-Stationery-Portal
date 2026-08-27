import { useEffect, useMemo, useState } from "react";

import {
  getAdminOverview,
  getStaff,
  createStaff,
  getStationery,
  addStationery,
  updateStationery,
  deleteStationery,
  getAdminDistribution,
  getAdminOrders,
} from "../api";

function AdminDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [orders, setOrders] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    role: "hod",
  });

  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    lowStockLimit: "20",
    source: "store",
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        overviewData,
        staffData,
        productData,
        distributionData,
        orderData,
      ] = await Promise.all([
        getAdminOverview(user.email),

        getStaff(user.email),

        getStationery(),

        getAdminDistribution(user.email),

        getAdminOrders(user.email),
      ]);

      setOverview(overviewData);

      setStaff(staffData);

      setProducts(productData);

      setDistribution(distributionData);

      setOrders(orderData);
    } catch (error) {
      setError(error.message || "Unable to load Admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user.email]);

  /* =========================================
     STAFF
  ========================================= */

  function handleStaffChange(field, value) {
    setStaffForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateStaff(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setTemporaryPassword("");

    if (
      !staffForm.name ||
      !staffForm.email ||
      !staffForm.employeeId ||
      !staffForm.department
    ) {
      setError("Please fill all staff fields.");
      return;
    }

    try {
      setSaving(true);

      const result = await createStaff({
        adminEmail: user.email,

        ...staffForm,
      });

      setMessage(result.message);

      setTemporaryPassword(result.temporaryPassword);

      setStaffForm({
        name: "",
        email: "",
        employeeId: "",
        department: "",
        role: "hod",
      });

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to create staff account.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     PRODUCTS
  ========================================= */

  function handleProductChange(field, value) {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddProduct(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !productForm.name ||
      !productForm.category ||
      productForm.price === "" ||
      productForm.stock === ""
    ) {
      setError("Please fill all product fields.");
      return;
    }

    try {
      setSaving(true);

      const result = await addStationery({
        adminEmail: user.email,

        name: productForm.name,

        category: productForm.category,

        price: Number(productForm.price),

        stock: Number(productForm.stock),

        lowStockLimit: Number(productForm.lowStockLimit),

        source: productForm.source,
      });

      setMessage(result.message);

      setProductForm({
        name: "",
        category: "",
        price: "",
        stock: "",
        lowStockLimit: "20",
        source: "store",
      });

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to add product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStockUpdate(product) {
    const newStock = window.prompt(
      `Enter new stock for ${product.name}:`,
      String(product.stock),
    );

    if (newStock === null) {
      return;
    }

    const stock = Number(newStock);

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a valid non-negative whole number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await updateStationery(product._id, {
        adminEmail: user.email,

        stock,
      });

      setMessage(result.message);

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to update stock.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveProduct(product) {
    const confirmed = window.confirm(
      `Remove ${product.name} from the active inventory?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await deleteStationery(product._id, user.email);

      setMessage(result.message);

      await loadDashboard();
    } catch (error) {
      setError(error.message || "Unable to remove product.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DERIVED DATA
  ========================================= */

  const collegeProducts = useMemo(
    () => products.filter((product) => product.source === "college"),
    [products],
  );

  const storeProducts = useMemo(
    () => products.filter((product) => product.source === "store"),
    [products],
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) => product.active && product.stock <= product.lowStockLimit,
      ),
    [products],
  );

  const hods = staff.filter((member) => member.role === "hod");

  const technicians = staff.filter((member) => member.role === "technician");

  const storepersons = staff.filter((member) => member.role === "storeperson");

  function getDistributionStatus(record) {
    return record.status === "Received" ? "Received" : "Pending";
  }

  function orderStatusClass(status) {
    if (status === "Completed") {
      return "status success";
    }

    if (status === "Cancelled") {
      return "status danger";
    }

    return "status pending";
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">Loading Admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* =================================
          TOP BAR
      ================================= */}

      <div className="topbar">
        <strong>BIT Stationery Portal</strong>

        <div className="top-actions">
          <span>{user.name}</span>

          <span>System Admin</span>

          <button className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container">
        {/* =================================
            HERO
        ================================= */}

        <div className="hero-card">
          <div>
            <p className="eyebrow">SYSTEM MANAGEMENT</p>

            <h1>Admin Dashboard</h1>

            <p className="muted">
              Overall management of college stationery, store inventory, staff
              and transactions.
            </p>
          </div>

          <div className="mini-stats">
            <span>{overview?.totalStudents || 0} Students</span>

            <span>{overview?.totalStock || 0} Stock</span>

            <span>{overview?.lowStockCount || 0} Low Stock</span>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="error-box">{error}</div>}

        {/* MESSAGE */}

        {message && <div className="info-box">{message}</div>}

        {/* TEMP PASSWORD */}

        {temporaryPassword && (
          <div className="success-box">
            <strong>Staff account created</strong>

            <p>Temporary password:</p>

            <code>{temporaryPassword}</code>

            <p className="muted">
              Give this password securely to the staff member. They should
              change it after their first login.
            </p>
          </div>
        )}

        {/* =================================
            TABS
        ================================= */}

        <div className="dashboard-tabs">
          <button
            className={activeTab === "overview" ? "tab active" : "tab"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>

          <button
            className={activeTab === "staff" ? "tab active" : "tab"}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </button>

          <button
            className={activeTab === "inventory" ? "tab active" : "tab"}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>

          <button
            className={activeTab === "distribution" ? "tab active" : "tab"}
            onClick={() => setActiveTab("distribution")}
          >
            College Distribution
          </button>

          <button
            className={activeTab === "orders" ? "tab active" : "tab"}
            onClick={() => setActiveTab("orders")}
          >
            Store Orders
          </button>
        </div>

        {/* =================================
            OVERVIEW
        ================================= */}

        {activeTab === "overview" && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="muted">Total Products</span>

                <strong>{overview?.productCount || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">College Stock</span>

                <strong>{overview?.collegeStock || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Store Stock</span>

                <strong>{overview?.storeStock || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Students</span>

                <strong>{overview?.totalStudents || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Staff</span>

                <strong>{overview?.totalStaff || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Pending Distribution</span>

                <strong>{overview?.collegePending || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Pending Store Orders</span>

                <strong>{overview?.storePending || 0}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Low Stock Products</span>

                <strong>{overview?.lowStockCount || 0}</strong>
              </div>
            </div>

            {/* LOW STOCK */}

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Low Stock Alerts</h2>

                  <p className="muted">
                    Products at or below their configured stock limit.
                  </p>
                </div>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="empty-card">
                  All products have sufficient stock.
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product._id} className="distribution-row">
                    <div>
                      <strong>{product.name}</strong>

                      <p className="muted">
                        {product.source === "college" ? "College" : "Store"}
                        {" • "}
                        Current stock: {product.stock}
                      </p>
                    </div>

                    <span className="status danger">Low Stock</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =================================
            STAFF
        ================================= */}

        {activeTab === "staff" && (
          <>
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Create Staff Account</h2>

                  <p className="muted">
                    Admin creates HOD, Technician and Storeperson accounts.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateStaff}>
                <div className="form-grid">
                  <div>
                    <label>Name</label>

                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(event) =>
                        handleStaffChange("name", event.target.value)
                      }
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label>Email</label>

                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(event) =>
                        handleStaffChange("email", event.target.value)
                      }
                      placeholder="College email"
                    />
                  </div>

                  <div>
                    <label>Employee ID</label>

                    <input
                      type="text"
                      value={staffForm.employeeId}
                      onChange={(event) =>
                        handleStaffChange("employeeId", event.target.value)
                      }
                      placeholder="Employee ID"
                    />
                  </div>

                  <div>
                    <label>Role</label>

                    <select
                      value={staffForm.role}
                      onChange={(event) =>
                        handleStaffChange("role", event.target.value)
                      }
                    >
                      <option value="hod">HOD</option>

                      <option value="technician">Technician</option>

                      <option value="storeperson">Storeperson</option>
                    </select>
                  </div>

                  <div>
                    <label>Department</label>

                    <input
                      type="text"
                      value={staffForm.department}
                      onChange={(event) =>
                        handleStaffChange("department", event.target.value)
                      }
                      placeholder={
                        staffForm.role === "storeperson" ? "STORE" : "CSE"
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Create Staff Account"}
                  </button>
                </div>
              </form>
            </div>

            {/* STAFF LIST */}

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Staff Directory</h2>

                  <p className="muted">Active staff accounts in the system.</p>
                </div>
              </div>

              {staff.length === 0 ? (
                <div className="empty-card">No staff accounts found.</div>
              ) : (
                staff.map((member) => (
                  <div
                    key={member.id || member._id}
                    className="distribution-row"
                  >
                    <div>
                      <strong>{member.name}</strong>

                      <p className="muted">
                        {member.email}
                        {" • "}
                        {member.employeeId || "No Employee ID"}
                      </p>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <span className="status success">{member.role}</span>

                      <p className="muted">{member.department}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* STAFF SUMMARY */}

            <div className="stats-grid">
              <div className="stat-card">
                <span className="muted">HODs</span>

                <strong>{hods.length}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Technicians</span>

                <strong>{technicians.length}</strong>
              </div>

              <div className="stat-card">
                <span className="muted">Storepersons</span>

                <strong>{storepersons.length}</strong>
              </div>
            </div>
          </>
        )}

        {/* =================================
            INVENTORY
        ================================= */}

        {activeTab === "inventory" && (
          <>
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Add Product</h2>

                  <p className="muted">
                    Admin manages both college and store inventory.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddProduct}>
                <div className="form-grid">
                  <div>
                    <label>Product Name</label>

                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(event) =>
                        handleProductChange("name", event.target.value)
                      }
                      placeholder="Product name"
                    />
                  </div>

                  <div>
                    <label>Category</label>

                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(event) =>
                        handleProductChange("category", event.target.value)
                      }
                      placeholder="Academic / Writing / Office"
                    />
                  </div>

                  <div>
                    <label>Price</label>

                    <input
                      type="number"
                      min="0"
                      value={productForm.price}
                      onChange={(event) =>
                        handleProductChange("price", event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label>Stock</label>

                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(event) =>
                        handleProductChange("stock", event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label>Low Stock Limit</label>

                    <input
                      type="number"
                      min="0"
                      value={productForm.lowStockLimit}
                      onChange={(event) =>
                        handleProductChange("lowStockLimit", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label>Product Type</label>

                    <select
                      value={productForm.source}
                      onChange={(event) =>
                        handleProductChange("source", event.target.value)
                      }
                    >
                      <option value="store">Store Product</option>

                      <option value="college">College Provided</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Adding..." : "Add Product"}
                  </button>
                </div>
              </form>
            </div>

            {/* COLLEGE INVENTORY */}

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>College Inventory</h2>

                  <p className="muted">
                    Products used for HOD semester allotments.
                  </p>
                </div>
              </div>

              {collegeProducts.length === 0 ? (
                <div className="empty-card">No college products.</div>
              ) : (
                collegeProducts.map((product) => (
                  <div key={product._id} className="distribution-row">
                    <div>
                      <strong>{product.name}</strong>

                      <p className="muted">
                        {product.category}
                        {" • "}
                        Stock: {product.stock}
                        {" • "}
                        Limit: {product.lowStockLimit}
                      </p>
                    </div>

                    <div className="row-actions">
                      <span
                        className={
                          product.stock <= product.lowStockLimit
                            ? "status danger"
                            : "status success"
                        }
                      >
                        {product.stock <= product.lowStockLimit
                          ? "Low Stock"
                          : "Available"}
                      </span>

                      <button
                        className="secondary-btn"
                        disabled={saving}
                        onClick={() => handleStockUpdate(product)}
                      >
                        Update Stock
                      </button>

                      <button
                        className="danger-btn"
                        disabled={saving}
                        onClick={() => handleRemoveProduct(product)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* STORE INVENTORY */}

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Store Inventory</h2>

                  <p className="muted">
                    Products students can purchase from the campus store.
                  </p>
                </div>
              </div>

              {storeProducts.length === 0 ? (
                <div className="empty-card">No store products.</div>
              ) : (
                storeProducts.map((product) => (
                  <div key={product._id} className="distribution-row">
                    <div>
                      <strong>{product.name}</strong>

                      <p className="muted">
                        {product.category}
                        {" • "}₹{product.price}
                        {" • "}
                        Stock: {product.stock}
                      </p>
                    </div>

                    <div className="row-actions">
                      <span
                        className={
                          product.stock <= product.lowStockLimit
                            ? "status danger"
                            : "status success"
                        }
                      >
                        {product.stock <= product.lowStockLimit
                          ? "Low Stock"
                          : "Available"}
                      </span>

                      <button
                        className="secondary-btn"
                        disabled={saving}
                        onClick={() => handleStockUpdate(product)}
                      >
                        Update Stock
                      </button>

                      <button
                        className="danger-btn"
                        disabled={saving}
                        onClick={() => handleRemoveProduct(product)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* =================================
            COLLEGE DISTRIBUTION
        ================================= */}

        {activeTab === "distribution" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>College Distribution</h2>

                <p className="muted">
                  Overall view of stationery distribution across departments.
                </p>
              </div>
            </div>

            {distribution.length === 0 ? (
              <div className="empty-card">No distribution records yet.</div>
            ) : (
              distribution.map((record) => (
                <div key={record._id} className="distribution-row">
                  <div>
                    <strong>{record.studentName}</strong>

                    <p className="muted">
                      {record.department}
                      {" • "}
                      Semester {record.semester}
                      {" • "}
                      {record.studentEmail}
                    </p>

                    <p className="muted">
                      {record.item.name}
                      {" × "}
                      {record.item.quantity}
                    </p>
                  </div>

                  <span
                    className={
                      getDistributionStatus(record) === "Received"
                        ? "status success"
                        : "status pending"
                    }
                  >
                    {getDistributionStatus(record)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================
            STORE ORDERS
        ================================= */}

        {activeTab === "orders" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Store Orders</h2>

                <p className="muted">
                  Overall view of student stationery purchases.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-card">No store orders yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <strong>
                        Order #{order._id.slice(-6).toUpperCase()}
                      </strong>

                      <p className="muted">{order.studentEmail}</p>

                      <p className="muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span className={orderStatusClass(order.status)}>
                      {order.status}
                    </span>
                  </div>

                  {order.items.map((item, index) => (
                    <div
                      key={`${order._id}-${index}`}
                      className="distribution-row"
                    >
                      <div>
                        <strong>{item.name}</strong>

                        <p className="muted">
                          ₹{item.price}
                          {" × "}
                          {item.quantity}
                        </p>
                      </div>

                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}

                  <div className="order-footer">
                    <strong>Total: ₹{order.totalAmount}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================
            ADMIN RULE
        ================================= */}

        <div className="panel">
          <div className="info-box">
            <strong>Admin access</strong>

            <p>
              Admin has overall visibility and inventory management access.
              Department HODs manage allotments, Technicians manage actual
              college distribution, and Storepersons manage outside stationery
              orders.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
