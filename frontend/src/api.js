const API_BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

/* =========================================
   AUTH
========================================= */

export async function login(email, password) {
  return request("/login", {
    method: "POST",

    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function registerStudent(studentData) {
  return request("/register/student", {
    method: "POST",

    body: JSON.stringify(studentData),
  });
}

export async function changePassword(userId, currentPassword, newPassword) {
  return request(`/users/${userId}/password`, {
    method: "PUT",

    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}

/* =========================================
   ADMIN — STAFF
========================================= */

export async function createStaff(staffData) {
  return request("/admin/staff", {
    method: "POST",

    body: JSON.stringify(staffData),
  });
}

export async function getStaff(adminEmail) {
  return request(`/admin/staff?adminEmail=${encodeURIComponent(adminEmail)}`);
}

/* =========================================
   STATIONERY
========================================= */

export async function getStationery() {
  return request("/stationery");
}

export async function addStationery(productData) {
  return request("/stationery", {
    method: "POST",

    body: JSON.stringify(productData),
  });
}

export async function updateStationery(id, productData) {
  return request(`/stationery/${id}`, {
    method: "PUT",

    body: JSON.stringify(productData),
  });
}

export async function deleteStationery(id, adminEmail) {
  return request(
    `/stationery/${id}?adminEmail=${encodeURIComponent(adminEmail)}`,
    {
      method: "DELETE",
    },
  );
}

/* =========================================
   HOD
========================================= */

export async function createAssignment(assignmentData) {
  return request("/hod/assignments", {
    method: "POST",

    body: JSON.stringify(assignmentData),
  });
}

export async function getHODAssignments(hodEmail) {
  return request(`/hod/assignments?hodEmail=${encodeURIComponent(hodEmail)}`);
}

export async function finalizeAssignment(assignmentId, hodEmail) {
  return request(`/hod/assignments/${assignmentId}/finalize`, {
    method: "PUT",

    body: JSON.stringify({
      hodEmail,
    }),
  });
}

export async function getHODStudents(hodEmail) {
  return request(`/hod/students?hodEmail=${encodeURIComponent(hodEmail)}`);
}

export async function getHODDistribution(hodEmail) {
  return request(`/hod/distribution?hodEmail=${encodeURIComponent(hodEmail)}`);
}

/* =========================================
   TECHNICIAN
========================================= */

export async function getTechnicianDistribution(technicianEmail) {
  return request(
    `/technician/distribution?technicianEmail=${encodeURIComponent(
      technicianEmail,
    )}`,
  );
}

export async function markItemReceived(distributionId, technicianEmail) {
  return request(`/technician/distribution/${distributionId}/received`, {
    method: "PUT",

    body: JSON.stringify({
      technicianEmail,
    }),
  });
}

export async function sendTechnicianNotification(notificationData) {
  return request("/technician/notifications", {
    method: "POST",

    body: JSON.stringify(notificationData),
  });
}

export async function getTechnicianNotifications(technicianEmail) {
  return request(
    `/technician/notifications?technicianEmail=${encodeURIComponent(
      technicianEmail,
    )}`,
  );
}

/* =========================================
   STUDENT — COLLEGE DISTRIBUTION
========================================= */

export async function getStudentDistribution(studentEmail) {
  return request(
    `/student/distribution?studentEmail=${encodeURIComponent(studentEmail)}`,
  );
}

export async function getStudentNotifications(studentEmail) {
  return request(
    `/student/notifications?studentEmail=${encodeURIComponent(studentEmail)}`,
  );
}

/* =========================================
   STUDENT — STORE
========================================= */

export async function getStoreProducts() {
  return request("/store/products");
}

export async function placeOrder(orderData) {
  return request("/orders", {
    method: "POST",

    body: JSON.stringify(orderData),
  });
}

export async function getStudentOrders(studentEmail) {
  return request(
    `/orders/student?studentEmail=${encodeURIComponent(studentEmail)}`,
  );
}

/* =========================================
   STOREPERSON
========================================= */

export async function getStorepersonOrders(storepersonEmail) {
  return request(
    `/storeperson/orders?storepersonEmail=${encodeURIComponent(
      storepersonEmail,
    )}`,
  );
}

export async function updateOrderStatus(orderId, storepersonEmail, status) {
  return request(`/storeperson/orders/${orderId}/status`, {
    method: "PUT",

    body: JSON.stringify({
      storepersonEmail,
      status,
    }),
  });
}

/* =========================================
   ADMIN — OVERVIEW
========================================= */

export async function getAdminOverview(adminEmail) {
  return request(
    `/admin/overview?adminEmail=${encodeURIComponent(adminEmail)}`,
  );
}

export async function getAdminDistribution(adminEmail) {
  return request(
    `/admin/distribution?adminEmail=${encodeURIComponent(adminEmail)}`,
  );
}

export async function getAdminOrders(adminEmail) {
  return request(`/admin/orders?adminEmail=${encodeURIComponent(adminEmail)}`);
}
