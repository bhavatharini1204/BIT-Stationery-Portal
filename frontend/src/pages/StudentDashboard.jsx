import { useEffect, useMemo, useState } from "react";
import {
  getStudentDistribution,
  getStudentNotifications,
  getStoreProducts,
  placeOrder,
  getStudentOrders,
} from "../api";

function StudentDashboard({ user, onLogout }) {
  const [distribution, setDistribution] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("college");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reloadDashboard = async () => {
    try {
      setSaving(true);
      setError("");
      const [distributionData, notificationData, productData, orderData] =
        await Promise.all([
          getStudentDistribution(user.email),
          getStudentNotifications(user.email),
          getStoreProducts(),
          getStudentOrders(user.email),
        ]);
      setDistribution(distributionData);
      setNotifications(notificationData);
      setProducts(productData);
      setOrders(orderData);
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
        const [distributionData, notificationData, productData, orderData] =
          await Promise.all([
            getStudentDistribution(user.email),
            getStudentNotifications(user.email),
            getStoreProducts(),
            getStudentOrders(user.email),
          ]);
        if (!isMounted) return;
        setDistribution(distributionData);
        setNotifications(notificationData);
        setProducts(productData);
        setOrders(orderData);
      } catch (err) {
        if (isMounted)
          setError(err.message || "Unable to load student portal.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user.email]);

  // Group distribution items
  const receivedCount = useMemo(
    () => distribution.filter((item) => item.status === "Received").length,
    [distribution],
  );

  const totalAssigned = distribution.length;
  const isKitFullyCollected =
    totalAssigned > 0 && receivedCount === totalAssigned;

  // Active technician crowd alerts
  const technicianAlerts = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "technician_message" || n.alertLevel,
    );
  }, [notifications]);

  // Other personal notifications
  const otherNotifications = useMemo(() => {
    return notifications.filter(
      (n) => n.type !== "technician_message" && !n.alertLevel,
    );
  }, [notifications]);

  // Store filtering
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  /* =========================================
     CART MANAGEMENT
  ========================================= */

  function addToCart(product) {
    setMessage("");
    setCart((current) => {
      const existing = current.find((i) => i._id === product._id);
      if (existing) {
        return current.map((i) =>
          i._id === product._id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function increaseQuantity(productId) {
    setCart((current) =>
      current.map((item) =>
        item._id === productId
          ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
          : item,
      ),
    );
  }

  function decreaseQuantity(productId) {
    setCart((current) =>
      current
        .map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  const cartTotal = cart.reduce((tot, i) => tot + i.price * i.quantity, 0);

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setMessage("Your shopping cart is empty.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const result = await placeOrder({
        studentEmail: user.email,
        items: cart.map((i) => ({
          stationeryId: i._id,
          quantity: i.quantity,
        })),
      });

      setMessage(
        `${result.message} Order #${result.order?._id?.slice(-6)?.toUpperCase() || ""} placed successfully! Collect from Campus Store.`,
      );
      setCart([]);
      await reloadDashboard();
      setActiveTab("orders");
    } catch (err) {
      setMessage(err.message || "Unable to place store order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell student-dashboard">
        <div className="container">
          <div className="panel">
            <p className="muted">Loading your student portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell student-dashboard">
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-crest">BIT</div>
          <div className="brand-info">
            <strong>Bannari Amman Institute of Technology</strong>
            <span>Student Portal • {user.department} Department</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
            <span className="user-role-pill">
              Sem {user.semester} • Year {Math.ceil(user.semester / 2)}
            </span>
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
            <p className="eyebrow">Academic Student Portal</p>
            <h1>Welcome back, {user.name}</h1>
            <p>
              Register Number:{" "}
              <strong>{user.registerNumber || "Enrolled"}</strong> •{" "}
              {user.department} Department • Semester {user.semester}
            </p>
          </div>

          <div className="mini-stats">
            <span>
              Kit Status:{" "}
              {totalAssigned === 0
                ? "Not Allocated"
                : isKitFullyCollected
                  ? "✓ Collected"
                  : `${receivedCount}/${totalAssigned} Collected`}
            </span>
            <span>{orders.length} Store Orders</span>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {/* TECHNICIAN CROWD ALERT & COLLECTION REMINDER */}
        {technicianAlerts.length > 0 && (
          <div style={{ marginBottom: "22px" }}>
            {technicianAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`crowd-banner ${
                  alert.alertLevel === "heavy_crowd"
                    ? "heavy"
                    : alert.alertLevel === "moderate"
                      ? "moderate"
                      : "normal"
                }`}
              >
                <div className="crowd-banner-content">
                  <div className="crowd-indicator-dot" />
                  <div className="crowd-text">
                    <strong>
                      {alert.alertLevel === "heavy_crowd"
                        ? "🔴 Heavy Queue Alert from Technician"
                        : alert.alertLevel === "moderate"
                          ? "🟡 Department Queue Notice"
                          : "🟢 Collection Desk Alert"}{" "}
                      — {alert.title}
                    </strong>
                    <p>{alert.message}</p>
                  </div>
                </div>

                {alert.timeSlot && (
                  <span className="crowd-time-pill">
                    ⏰ Suggested Window: {alert.timeSlot}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other Notifications */}
        {otherNotifications.length > 0 && (
          <div className="panel" style={{ padding: "16px 20px" }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                color: "var(--bit-slate-700)",
              }}
            >
              Institutional Notifications
            </h3>
            {otherNotifications.map((n) => (
              <div
                key={n._id}
                className="info-box"
                style={{ marginBottom: "8px" }}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === "college" ? "tab active" : "tab"}
            onClick={() => setActiveTab("college")}
          >
            📚 College Stationery Kit ({distribution.length})
          </button>
          <button
            className={activeTab === "store" ? "tab active" : "tab"}
            onClick={() => setActiveTab("store")}
          >
            🏪 Campus Stationery Store ({products.length})
          </button>
          <button
            className={activeTab === "orders" ? "tab active" : "tab"}
            onClick={() => setActiveTab("orders")}
          >
            🛍️ My Orders ({orders.length})
          </button>
        </div>

        {/* SECTION 1: COLLEGE ALLOCATED STATIONERY KIT */}
        {activeTab === "college" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>
                  Semester {user.semester} Stationery Kit (Supplied by College)
                </h2>
                <p>
                  Curated academic kit allotted by your {user.department} HOD.
                  Collect from your Department Technician.
                </p>
              </div>

              <span
                className={
                  isKitFullyCollected ? "status success" : "status pending"
                }
              >
                {totalAssigned === 0
                  ? "Pending Allotment"
                  : isKitFullyCollected
                    ? "✓ Full Kit Collected"
                    : "Ready for Collection"}
              </span>
            </div>

            {distribution.length === 0 ? (
              <div className="empty-card">
                No stationery kit has been assigned for Semester {user.semester}{" "}
                yet. Your HOD will finalize the semester allotment soon.
              </div>
            ) : (
              <div className="selection-list">
                {distribution.map((record) => {
                  const isReceived = record.status === "Received";
                  return (
                    <div
                      key={record._id}
                      className="selection-row"
                      style={{
                        background: isReceived ? "#eee8f7" : "#f8f4fc",
                      }}
                    >
                      <div>
                        <strong>{record.item.name}</strong>
                        <p className="muted">
                          Quantity:{" "}
                          <strong>{record.item.quantity} units</strong> •
                          Academic Year: {record.academicYear}
                        </p>
                        {isReceived && record.receivedAt && (
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "12px",
                              color: "var(--bit-emerald)",
                              fontWeight: "700",
                            }}
                          >
                            Verified & Collected on{" "}
                            {new Date(record.receivedAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <span
                        className={
                          isReceived ? "status success" : "status pending"
                        }
                      >
                        {isReceived ? "✓ Collected" : "Not Collected"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "24px" }} className="info-box">
              <strong>Collection Instructions:</strong>
              <p>
                Please report to your {user.department} Department Lab with your
                valid College ID Card. Check the top notification banner for
                current queue timings announced by your Technician.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2: CAMPUS STORE (RETAIL SHOPPING) */}
        {activeTab === "store" && (
          <>
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Campus Stationery Store Catalog</h2>
                  <p>
                    Browse and order engineering calculators, notebooks, pens,
                    and project sheets.
                  </p>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="chip-group">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip-btn ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "All Products" : cat}
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-card">
                  No products found in this category.
                </div>
              ) : (
                <div className="product-grid">
                  {filteredProducts.map((p) => {
                    const inStock = p.active && p.stock > 0;
                    return (
                      <div key={p._id} className="product-card">
                        <div>
                          <div className="product-header">
                            <span className="product-category-tag">
                              {p.category}
                            </span>
                            <span
                              className={
                                inStock ? "status success" : "status danger"
                              }
                            >
                              {inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>

                          <h3>{p.name}</h3>
                          <div className="product-stock-info">
                            <span className="muted">Available: </span>
                            <strong>{p.stock} units</strong>
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              margin: "14px 0 8px",
                            }}
                          >
                            <span
                              className="muted"
                              style={{ fontSize: "12px" }}
                            >
                              Price
                            </span>
                            <span className="price">₹{p.price}</span>
                          </div>

                          <button
                            className="primary-btn full btn-sm"
                            disabled={!inStock}
                            onClick={() => addToCart(p)}
                          >
                            {inStock ? "+ Add to Cart" : "Out of Stock"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shopping Cart Drawer / Panel */}
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Your Cart ({cart.length} items)</h2>
                  <p>Review items before submitting your campus store order.</p>
                </div>
                {cart.length > 0 && (
                  <button
                    className="danger-btn btn-sm"
                    onClick={() => setCart([])}
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="empty-card">Your cart is currently empty.</div>
              ) : (
                <>
                  <div className="selection-list">
                    {cart.map((item) => (
                      <div key={item._id} className="selection-row">
                        <div>
                          <strong>{item.name}</strong>
                          <p className="muted">₹{item.price} each</p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <button
                              className="secondary-btn btn-sm"
                              style={{
                                width: "30px",
                                height: "30px",
                                padding: 0,
                              }}
                              onClick={() => decreaseQuantity(item._id)}
                            >
                              −
                            </button>
                            <span
                              style={{
                                minWidth: "24px",
                                textAlign: "center",
                                fontWeight: "800",
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              className="secondary-btn btn-sm"
                              style={{
                                width: "30px",
                                height: "30px",
                                padding: 0,
                              }}
                              onClick={() => increaseQuantity(item._id)}
                            >
                              +
                            </button>
                          </div>

                          <strong
                            style={{ minWidth: "60px", textAlign: "right" }}
                          >
                            ₹{item.price * item.quantity}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer" style={{ marginTop: "20px" }}>
                    <div>
                      <span className="muted" style={{ fontSize: "12px" }}>
                        Total Amount to Pay at Counter
                      </span>
                      <h2 style={{ margin: 0, color: "var(--bit-navy-dark)" }}>
                        ₹{cartTotal}
                      </h2>
                    </div>

                    <button
                      className="primary-btn"
                      disabled={saving || cart.length === 0}
                      onClick={handlePlaceOrder}
                    >
                      {saving ? "Placing Order..." : "Confirm & Place Order"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* SECTION 3: MY STORE ORDERS */}
        {activeTab === "orders" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>My Campus Store Orders</h2>
                <p>Track order fulfillment and pickup status.</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-card">
                You haven't placed any store orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <strong>
                        Order #{order._id.slice(-6).toUpperCase()}
                      </strong>
                      <p className="muted">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={
                        order.status === "Completed"
                          ? "status success"
                          : order.status === "Ready"
                            ? "status success"
                            : order.status === "Cancelled"
                              ? "status danger"
                              : "status pending"
                      }
                    >
                      {order.status === "Ready"
                        ? "✓ Ready for Pickup"
                        : order.status}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="order-item-line">
                        <span>
                          {i.name} × <strong>{i.quantity}</strong>
                        </span>
                        <strong>₹{i.price * i.quantity}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div>
                      <span className="muted" style={{ fontSize: "12px" }}>
                        Total Bill
                      </span>
                      <h3 style={{ margin: 0 }}>₹{order.totalAmount}</h3>
                    </div>

                    {order.status === "Ready" && (
                      <span
                        style={{
                          color: "var(--bit-emerald)",
                          fontWeight: "800",
                          fontSize: "13px",
                        }}
                      >
                        Pickup ready at Campus Store counter!
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
