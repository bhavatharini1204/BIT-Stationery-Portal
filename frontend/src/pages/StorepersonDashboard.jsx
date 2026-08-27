import { useEffect, useMemo, useState } from "react";

import { getStorepersonOrders, updateOrderStatus } from "../api";

function StorepersonDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getStorepersonOrders(user.email);

      setOrders(data);
    } catch (error) {
      setError(error.message || "Unable to load store orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [user.email]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "Pending"),
    [orders],
  );

  const processingOrders = useMemo(
    () => orders.filter((order) => order.status === "Processing"),
    [orders],
  );

  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === "Ready"),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "Completed"),
    [orders],
  );

  async function handleStatusChange(orderId, status) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await updateOrderStatus(orderId, user.email, status);

      setMessage(result.message);

      await loadOrders();
    } catch (error) {
      setError(error.message || "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  function getNextAction(order) {
    if (order.status === "Pending") {
      return {
        label: "Start Processing",
        nextStatus: "Processing",
      };
    }

    if (order.status === "Processing") {
      return {
        label: "Mark Ready",
        nextStatus: "Ready",
      };
    }

    if (order.status === "Ready") {
      return {
        label: "Complete Order",
        nextStatus: "Completed",
      };
    }

    return null;
  }

  function renderOrderCard(order) {
    const action = getNextAction(order);

    return (
      <div key={order._id} className="order-card">
        <div className="order-header">
          <div>
            <strong>Order #{order._id.slice(-6).toUpperCase()}</strong>

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
                  : "status pending"
            }
          >
            {order.status}
          </span>
        </div>

        <div className="order-items">
          {order.items.map((item, index) => (
            <div key={`${order._id}-${index}`} className="distribution-row">
              <div>
                <strong>{item.name}</strong>

                <p className="muted">
                  ₹{item.price} × {item.quantity}
                </p>
              </div>

              <strong>₹{item.price * item.quantity}</strong>
            </div>
          ))}
        </div>

        <div className="order-footer">
          <div>
            <span className="muted">Total</span>

            <h3
              style={{
                margin: "3px 0",
              }}
            >
              ₹{order.totalAmount}
            </h3>
          </div>

          <div className="row-actions">
            {action && (
              <button
                className="primary-btn"
                disabled={saving}
                onClick={() => handleStatusChange(order._id, action.nextStatus)}
              >
                {action.label}
              </button>
            )}

            {order.status === "Pending" && (
              <button
                className="danger-btn"
                disabled={saving}
                onClick={() => handleStatusChange(order._id, "Cancelled")}
              >
                Cancel
              </button>
            )}

            {order.status === "Processing" && (
              <button
                className="danger-btn"
                disabled={saving}
                onClick={() => handleStatusChange(order._id, "Cancelled")}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="panel">Loading store orders...</div>
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

          <span>Storeperson</span>

          <button className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container">
        {/* HERO */}

        <div className="hero-card">
          <div>
            <p className="eyebrow">CAMPUS STORE</p>

            <h1>Store Management</h1>

            <p className="muted">
              Manage student stationery orders from one place.
            </p>
          </div>

          <div className="mini-stats">
            <span>{pendingOrders.length} Pending</span>

            <span>{processingOrders.length} Processing</span>

            <span>{readyOrders.length} Ready</span>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="error-box">{error}</div>}

        {/* MESSAGE */}

        {message && <div className="info-box">{message}</div>}

        {/* =====================================
            PENDING
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>New Orders</h2>

              <p className="muted">Orders waiting to be processed.</p>
            </div>

            <span className="status pending">{pendingOrders.length}</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="empty-card">No pending orders.</div>
          ) : (
            pendingOrders.map(renderOrderCard)
          )}
        </div>

        {/* =====================================
            PROCESSING
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Processing</h2>

              <p className="muted">Orders currently being prepared.</p>
            </div>

            <span className="status pending">{processingOrders.length}</span>
          </div>

          {processingOrders.length === 0 ? (
            <div className="empty-card">
              No orders are currently being processed.
            </div>
          ) : (
            processingOrders.map(renderOrderCard)
          )}
        </div>

        {/* =====================================
            READY
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Ready for Collection</h2>

              <p className="muted">
                Orders prepared and waiting for the student.
              </p>
            </div>

            <span className="status success">{readyOrders.length}</span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="empty-card">No orders are ready.</div>
          ) : (
            readyOrders.map(renderOrderCard)
          )}
        </div>

        {/* =====================================
            COMPLETED
        ===================================== */}

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Completed Orders</h2>

              <p className="muted">Recently completed student purchases.</p>
            </div>

            <span className="status success">{completedOrders.length}</span>
          </div>

          {completedOrders.length === 0 ? (
            <div className="empty-card">No completed orders yet.</div>
          ) : (
            completedOrders.map(renderOrderCard)
          )}
        </div>

        {/* ACCESS INFORMATION */}

        <div className="panel">
          <div className="info-box">
            <strong>Storeperson access</strong>

            <p>
              This dashboard is only for outside stationery store orders.
              College semester distribution is managed separately by the HOD and
              department Technician.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StorepersonDashboard;
