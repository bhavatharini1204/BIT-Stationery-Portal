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

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
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
    } catch (error) {
      setError(error.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user.email]);

  /*
   * Group distribution by assignment.
   */

  const groupedDistribution = useMemo(() => {
    const groups = {};

    distribution.forEach((record) => {
      const key = String(record.assignment);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(record);
    });

    return Object.values(groups);
  }, [distribution]);

  const currentAssignment =
    groupedDistribution.length > 0 ? groupedDistribution[0] : [];

  const receivedCount = currentAssignment.filter(
    (item) => item.status === "Received",
  ).length;

  const totalAssigned = currentAssignment.length;

  /*
   * CART FUNCTIONS
   */

  function addToCart(product) {
    setMessage("");

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item._id === product._id);

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item._id !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.min(item.quantity + 1, item.stock),
        };
      }),
    );
  }

  function decreaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item._id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setMessage("");

      const result = await placeOrder({
        studentEmail: user.email,

        items: cart.map((item) => ({
          stationeryId: item._id,

          quantity: item.quantity,
        })),
      });

      setMessage(result.message);

      setCart([]);

      const updatedOrders = await getStudentOrders(user.email);

      setOrders(updatedOrders);
    } catch (error) {
      setMessage(error.message || "Unable to place order.");
    }
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
          <div className="panel">Loading student dashboard...</div>
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

          <span>{user.department}</span>

          <button className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container">
        {/* HERO */}

        <div className="hero-card">
          <div>
            <p className="eyebrow">STUDENT PORTAL</p>

            <h1>Welcome, {user.name}</h1>

            <p className="muted">
              {user.department} • Semester {user.semester}
            </p>
          </div>

          <div className="mini-stats">
            <span>
              {receivedCount}/{totalAssigned} received
            </span>

            <span>
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="error-box">{error}</div>}

        {/* NOTIFICATIONS */}

        {notifications.length > 0 && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>Notifications</h2>

                <p className="muted">Important updates for you</p>
              </div>
            </div>

            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="info-box"
                style={{
                  marginBottom: "10px",
                }}
              >
                <strong>{notification.title}</strong>

                <p
                  style={{
                    margin: "7px 0",
                  }}
                >
                  {notification.message}
                </p>

                <small>
                  Expires: {new Date(notification.expiresAt).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}

        {/* MAIN TABS */}

        <div className="dashboard-tabs">
          <button
            className={activeTab === "college" ? "tab active" : "tab"}
            onClick={() => setActiveTab("college")}
          >
            College Distribution
          </button>

          <button
            className={activeTab === "store" ? "tab active" : "tab"}
            onClick={() => setActiveTab("store")}
          >
            Stationery Store
          </button>

          <button
            className={activeTab === "orders" ? "tab active" : "tab"}
            onClick={() => setActiveTab("orders")}
          >
            My Orders
          </button>
        </div>

        {/* =================================
            COLLEGE DISTRIBUTION
        ================================= */}

        {activeTab === "college" && (
          <>
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Semester Stationery</h2>

                  <p className="muted">
                    Items assigned to you by your department
                  </p>
                </div>

                <span
                  className={
                    totalAssigned > 0 && receivedCount === totalAssigned
                      ? "status success"
                      : "status pending"
                  }
                >
                  {totalAssigned === 0
                    ? "Not Assigned"
                    : receivedCount === totalAssigned
                      ? "All Received"
                      : "Pending"}
                </span>
              </div>

              {currentAssignment.length === 0 ? (
                <div className="empty-card">
                  Your department has not assigned semester stationery yet.
                </div>
              ) : (
                <div>
                  {currentAssignment.map((item) => (
                    <div key={item._id} className="distribution-row">
                      <div>
                        <strong>{item.item.name}</strong>

                        <p className="muted">Quantity: {item.item.quantity}</p>
                      </div>

                      <span
                        className={
                          item.status === "Received"
                            ? "status success"
                            : "status pending"
                        }
                      >
                        {item.status === "Received"
                          ? "Received"
                          : "Not Collected"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Distribution Information</h2>

                  <p className="muted">
                    Your department technician manages the actual collection.
                  </p>
                </div>
              </div>

              <div className="info-box">
                You will receive a notification when all your assigned
                stationery items have been marked as received.
              </div>

              <p className="muted">
                Notifications from your department technician are shown above
                and automatically disappear after their expiry time.
              </p>
            </div>
          </>
        )}

        {/* =================================
            STORE
        ================================= */}

        {activeTab === "store" && (
          <>
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Campus Stationery Store</h2>

                  <p className="muted">
                    Purchase additional stationery from the campus store.
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="empty-card">No store products available.</div>
              ) : (
                <div className="product-grid">
                  {products.map((product) => (
                    <div key={product._id} className="product-card">
                      <div className="product-icon">
                        {product.name.charAt(0).toUpperCase()}
                      </div>

                      <h3>{product.name}</h3>

                      <p className="muted">{product.category}</p>

                      <p className="price">₹{product.price}</p>

                      <p className="muted">Stock: {product.stock}</p>

                      <button
                        className="primary-btn"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                      >
                        {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CART */}

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Your Cart</h2>

                  <p className="muted">Review your store items</p>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="empty-card">Your cart is empty.</div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item._id} className="distribution-row">
                      <div>
                        <strong>{item.name}</strong>

                        <p className="muted">₹{item.price} each</p>
                      </div>

                      <div className="cart-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => decreaseQuantity(item._id)}
                        >
                          −
                        </button>

                        <strong>{item.quantity}</strong>

                        <button
                          className="quantity-btn"
                          onClick={() => increaseQuantity(item._id)}
                        >
                          +
                        </button>
                      </div>

                      <strong>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}

                  <div className="cart-summary">
                    <div>
                      <span className="muted">Total</span>

                      <h2
                        style={{
                          margin: "4px 0",
                        }}
                      >
                        ₹{cartTotal}
                      </h2>
                    </div>

                    <button className="primary-btn" onClick={handlePlaceOrder}>
                      Place Order
                    </button>
                  </div>
                </>
              )}

              {message && <div className="info-box">{message}</div>}
            </div>
          </>
        )}

        {/* =================================
            MY ORDERS
        ================================= */}

        {activeTab === "orders" && (
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>My Store Orders</h2>

                <p className="muted">
                  Track stationery purchased from the campus store.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-card">
                You haven't placed any store orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="distribution-row">
                  <div>
                    <strong>Order #{order._id.slice(-6).toUpperCase()}</strong>

                    <p className="muted">
                      {order.items
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .join(", ")}
                    </p>

                    <p className="muted">₹{order.totalAmount}</p>
                  </div>

                  <span className={orderStatusClass(order.status)}>
                    {order.status}
                  </span>
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
