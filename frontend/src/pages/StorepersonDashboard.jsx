import { useEffect, useMemo, useState } from "react";
import {
  getStorepersonOrders,
  updateOrderStatus,
  getStorepersonAssignments,
  dispatchCollegeAssignment,
  getStationery,
  addStationery,
  updateStoreProductStock,
} from "../api";

function StorepersonDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [collegeAssignments, setCollegeAssignments] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    lowStockLimit: "20",
    source: "store",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("allotments");

  const reloadAll = async () => {
    try {
      setSaving(true);
      setError("");
      const [orderData, assignmentData, productData] = await Promise.all([
        getStorepersonOrders(user.email),
        getStorepersonAssignments(user.email),
        getStationery(),
      ]);
      setOrders(orderData);
      setCollegeAssignments(assignmentData);
      setInventoryProducts(productData);
      setStoreProducts(productData.filter((p) => p.source === "store"));
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
        const [orderData, assignmentData, productData] = await Promise.all([
          getStorepersonOrders(user.email),
          getStorepersonAssignments(user.email),
          getStationery(),
        ]);
        if (!isMounted) return;
        setOrders(orderData);
        setCollegeAssignments(assignmentData);
        setInventoryProducts(productData);
        setStoreProducts(productData.filter((p) => p.source === "store"));
      } catch (err) {
        if (isMounted)
          setError(err.message || "Unable to load Storeperson dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user.email]);

  const pendingDispatches = useMemo(
    () =>
      collegeAssignments.filter(
        (a) => a.dispatchStatus !== "Dispatched to Department",
      ),
    [collegeAssignments],
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "Pending"),
    [orders],
  );

  const processingOrders = useMemo(
    () => orders.filter((o) => o.status === "Processing"),
    [orders],
  );

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "Ready"),
    [orders],
  );

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
      !productForm.name.trim() ||
      !productForm.category.trim() ||
      productForm.price === "" ||
      productForm.stock === ""
    ) {
      setError("Please fill in the product name, category, price, and stock.");
      return;
    }

    try {
      setSaving(true);
      const result = await addStationery({
        storepersonEmail: user.email,
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
      await reloadAll();
    } catch (err) {
      setError(err.message || "Unable to add product stock.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDispatchAssignment(assignmentId, dept, sem) {
    const confirmed = window.confirm(
      `Dispatch college stationery for ${dept} Semester ${sem}? This will mark the batch as sent and notify the Department Technician.`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await dispatchCollegeAssignment(assignmentId, user.email);
      setMessage(result.message);
      await reloadAll();
    } catch (err) {
      setError(err.message || "Unable to dispatch assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = await updateOrderStatus(orderId, user.email, status);
      setMessage(result.message);
      await reloadAll();
    } catch (err) {
      setError(err.message || "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProductAvailability(product) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const newActive = !product.active;
      await updateStoreProductStock(
        product._id,
        user.email,
        product.stock,
        newActive,
      );
      setMessage(
        `${product.name} is now marked ${newActive ? "Available" : "Unavailable"}.`,
      );
      await reloadAll();
    } catch (err) {
      setError(err.message || "Unable to update product availability.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStockUpdate(product) {
    const promptVal = window.prompt(
      `Update stock for "${product.name}":`,
      String(product.stock),
    );
    if (promptVal === null) return;
    const stockNum = Number(promptVal);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Stock must be 0 or higher.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await updateStoreProductStock(
        product._id,
        user.email,
        stockNum,
        product.active,
      );
      setMessage(`Updated stock for ${product.name} to ${stockNum}.`);
      await reloadAll();
    } catch (err) {
      setError(err.message || "Unable to update stock.");
    } finally {
      setSaving(false);
    }
  }

  function getNextAction(order) {
    if (order.status === "Pending") {
      return { label: "Accept & Pack", nextStatus: "Processing" };
    }
    if (order.status === "Processing") {
      return { label: "Mark Ready for Pickup", nextStatus: "Ready" };
    }
    if (order.status === "Ready") {
      return { label: "Hand Over (Complete)", nextStatus: "Completed" };
    }
    return null;
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">
            <p className="muted">Loading Campus Storeperson Dashboard...</p>
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
            <span>Campus Central Store Portal</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
            <span className="user-role-pill">Storeperson</span>
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
            <p className="eyebrow">Inventory & Dispatch Hub</p>
            <h1>Campus Central Stationery Operations</h1>
            <p>
              Dual oversight: (1) Prepare and dispatch HOD college semester
              allotments to department technicians, and (2) Manage campus store
              retail inventory & fulfill direct student orders.
            </p>
          </div>

          <div className="mini-stats">
            <span>{pendingDispatches.length} Allotments to Dispatch</span>
            <span>{pendingOrders.length} New Orders</span>
            <span>{storeProducts.length} Retail Products</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === "allotments" ? "tab active" : "tab"}
            onClick={() => setActiveTab("allotments")}
          >
            📦 College Allotments from HODs ({collegeAssignments.length})
          </button>
          <button
            className={activeTab === "orders" ? "tab active" : "tab"}
            onClick={() => setActiveTab("orders")}
          >
            🛒 Student Store Orders ({orders.length})
          </button>
          <button
            className={activeTab === "products" ? "tab active" : "tab"}
            onClick={() => setActiveTab("products")}
          >
            🏷️ Inventory & Stock ({inventoryProducts.length})
          </button>
        </div>

        {/* VIEW 1: COLLEGE ALLOTMENTS FROM HODs */}
        {activeTab === "allotments" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>College Stationery Allotments (Assigned by HODs)</h2>
                <p>
                  Bulk allocations requested by department HODs for
                  distribution. Prepare and dispatch batch stock to the
                  respective department technician.
                </p>
              </div>
              <span className="status pending">
                {pendingDispatches.length} Pending Dispatch
              </span>
            </div>

            {collegeAssignments.length === 0 ? (
              <div className="empty-card">
                No finalized college allotments received from HODs yet.
              </div>
            ) : (
              collegeAssignments.map((assignment) => {
                const totalUnits = assignment.items.reduce(
                  (sum, i) => sum + i.quantity * (assignment.studentCount || 1),
                  0,
                );
                const isDispatched =
                  assignment.dispatchStatus === "Dispatched to Department";

                return (
                  <div
                    key={assignment._id}
                    className="panel"
                    style={{
                      background: isDispatched ? "#f3effa" : "#eee8f7",
                      border: "1px solid var(--bit-slate-200)",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      className="section-heading"
                      style={{ marginBottom: "12px" }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: "0 0 3px",
                            fontSize: "17px",
                            color: "var(--bit-navy-dark)",
                          }}
                        >
                          {assignment.department} Department • Semester{" "}
                          {assignment.semester} (Year{" "}
                          {Math.ceil(assignment.semester / 2)})
                        </h3>
                        <p className="muted">
                          Academic Year: {assignment.academicYear} • Allocated
                          by HOD: {assignment.createdBy?.name || "HOD"}
                          {" • "}
                          Enrolled Students:{" "}
                          <strong>{assignment.studentCount}</strong>
                        </p>
                      </div>

                      <span
                        className={
                          isDispatched ? "status success" : "status pending"
                        }
                      >
                        {isDispatched
                          ? "✓ Dispatched to Dept"
                          : "Pending Dispatch"}
                      </span>
                    </div>

                    {/* Material requirements by student and batch total */}
                    <div
                      style={{
                        borderTop: "1px solid var(--bit-slate-200)",
                        paddingTop: "10px",
                        marginBottom: "14px",
                      }}
                    >
                      <strong>Material Requirements:</strong>
                      <div style={{ overflowX: "auto", marginTop: "8px" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "13px",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#f3effa" }}>
                              {["Material", "Quantity per student", "Students", "Total quantity needed"].map((heading) => (
                                <th
                                  key={heading}
                                  scope="col"
                                  style={{
                                    padding: "9px 10px",
                                    border: "1px solid var(--bit-slate-200)",
                                  }}
                                >
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {assignment.items.map((it, idx) => (
                              <tr key={`${it.name}-${idx}`}>
                                <td style={{ padding: "9px 10px", border: "1px solid var(--bit-slate-200)" }}>
                                  <strong>{it.name}</strong>
                                </td>
                                <td style={{ padding: "9px 10px", border: "1px solid var(--bit-slate-200)" }}>
                                  {it.quantity} units
                                </td>
                                <td style={{ padding: "9px 10px", border: "1px solid var(--bit-slate-200)" }}>
                                  {assignment.studentCount || 1}
                                </td>
                                <td style={{ padding: "9px 10px", border: "1px solid var(--bit-slate-200)" }}>
                                  <strong>{it.quantity * (assignment.studentCount || 1)} units</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="order-footer">
                      <div>
                        <p
                          className="muted"
                          style={{ margin: 0, fontSize: "12.5px" }}
                        >
                          Dept Technician:{" "}
                          <strong>
                            {assignment.technician?.name ||
                              "Department Technician"}
                          </strong>
                          {" • "}
                          Total batch: <strong>{totalUnits} items</strong>
                        </p>
                      </div>

                      <div className="row-actions">
                        {!isDispatched ? (
                          <button
                            className="primary-btn btn-sm"
                            disabled={saving}
                            onClick={() =>
                              handleDispatchAssignment(
                                assignment._id,
                                assignment.department,
                                assignment.semester,
                              )
                            }
                          >
                            ✓ Dispatch to Department Technician
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: "12.5px",
                              color: "var(--bit-emerald)",
                              fontWeight: "700",
                            }}
                          >
                            Dispatched on{" "}
                            {new Date(
                              assignment.dispatchedAt || assignment.updatedAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 2: STUDENT STORE ORDERS */}
        {activeTab === "orders" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Campus Store Student Orders</h2>
                <p>
                  Process, pack, and hand over retail purchases placed by
                  students.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="status pending">
                  {pendingOrders.length} New
                </span>
                <span className="status info">
                  {processingOrders.length} Packing
                </span>
                <span className="status success">
                  {readyOrders.length} Ready
                </span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-card">No student store orders found.</div>
            ) : (
              orders.map((order) => {
                const action = getNextAction(order);
                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong style={{ fontSize: "15px" }}>
                          Order #{order._id.slice(-6).toUpperCase()}
                        </strong>
                        <p className="muted">{order.studentEmail}</p>
                        <p className="muted">
                          Placed: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={
                          order.status === "Completed"
                            ? "status success"
                            : order.status === "Cancelled"
                              ? "status danger"
                              : order.status === "Ready"
                                ? "status success"
                                : "status pending"
                        }
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div
                          key={`${order._id}-${index}`}
                          className="order-item-line"
                        >
                          <span>
                            {item.name} × <strong>{item.quantity}</strong>
                          </span>
                          <strong>₹{item.price * item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <div>
                        <span className="muted" style={{ fontSize: "12px" }}>
                          Total Amount
                        </span>
                        <h3
                          style={{ margin: 0, color: "var(--bit-navy-dark)" }}
                        >
                          ₹{order.totalAmount}
                        </h3>
                      </div>

                      <div className="row-actions">
                        {action && (
                          <button
                            className="primary-btn btn-sm"
                            disabled={saving}
                            onClick={() =>
                              handleStatusChange(order._id, action.nextStatus)
                            }
                          >
                            {action.label}
                          </button>
                        )}

                        {["Pending", "Processing"].includes(order.status) && (
                          <button
                            className="danger-btn btn-sm"
                            disabled={saving}
                            onClick={() =>
                              handleStatusChange(order._id, "Cancelled")
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 3: STORE PRODUCTS & STOCK AVAILABILITY */}
        {activeTab === "products" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Inventory & Stock Management</h2>
                <p>
                  Add college or retail products, update stock, and manage
                  availability.
                </p>
              </div>
            </div>

            <form className="inventory-form" onSubmit={handleAddProduct}>
              <div className="form-grid">
                <div>
                  <label htmlFor="inventory-product-name">Product Name</label>
                  <input
                    id="inventory-product-name"
                    type="text"
                    value={productForm.name}
                    onChange={(event) =>
                      handleProductChange("name", event.target.value)
                    }
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="inventory-product-category">Category</label>
                  <input
                    id="inventory-product-category"
                    type="text"
                    value={productForm.category}
                    onChange={(event) =>
                      handleProductChange("category", event.target.value)
                    }
                    placeholder="Writing, paper, academic..."
                    required
                  />
                </div>
                <div>
                  <label htmlFor="inventory-product-price">Price</label>
                  <input
                    id="inventory-product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) =>
                      handleProductChange("price", event.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="inventory-product-stock">Initial Stock</label>
                  <input
                    id="inventory-product-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={(event) =>
                      handleProductChange("stock", event.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="inventory-low-stock">Low Stock Limit</label>
                  <input
                    id="inventory-low-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.lowStockLimit}
                    onChange={(event) =>
                      handleProductChange("lowStockLimit", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="inventory-product-source">Inventory Type</label>
                  <select
                    id="inventory-product-source"
                    value={productForm.source}
                    onChange={(event) =>
                      handleProductChange("source", event.target.value)
                    }
                  >
                    <option value="store">Campus Store</option>
                    <option value="college">College Kit</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Adding Product..." : "Add Product to Inventory"}
                </button>
              </div>
            </form>

            {inventoryProducts.length === 0 ? (
              <div className="empty-card">No inventory products found.</div>
            ) : (
              <div className="selection-list">
                {inventoryProducts.map((p) => (
                  <div key={p._id} className="selection-row">
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <strong>{p.name}</strong>
                        <span className="product-category-tag">
                          {p.source === "college" ? "College Kit" : "Campus Store"}
                        </span>
                      </div>
                      <p className="muted">
                        {p.category} • Price: <strong>₹{p.price}</strong> • Live Stock:{" "}
                        <strong
                          style={{
                            color:
                              p.stock <= p.lowStockLimit
                                ? "var(--bit-rose)"
                                : "var(--bit-navy-dark)",
                          }}
                        >
                          {p.stock} units
                        </strong>{" "}
                        {p.stock <= p.lowStockLimit && " (Low Stock)"}
                      </p>
                    </div>

                    <div className="row-actions">
                      <span
                        className={
                          p.active && p.stock > 0
                            ? "status success"
                            : "status danger"
                        }
                      >
                        {p.active && p.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>

                      <button
                        className="secondary-btn btn-sm"
                        disabled={saving}
                        onClick={() => handleQuickStockUpdate(p)}
                      >
                        ✏️ Adjust Stock
                      </button>

                      <button
                        className={
                          p.active ? "danger-btn btn-sm" : "success-btn btn-sm"
                        }
                        disabled={saving}
                        onClick={() => handleToggleProductAvailability(p)}
                      >
                        {p.active ? "Set Unavailable" : "Set Available"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StorepersonDashboard;
