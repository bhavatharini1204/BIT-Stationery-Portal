const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");

const User = require("./models/User");
const Stationery = require("./models/Stationery");
const SemesterAssignment = require("./models/SemesterAssignment");
const Distribution = require("./models/Distribution");
const Notification = require("./models/Notification");
const Order = require("./models/Order");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

/* =====================================================
   HELPERS
===================================================== */

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function generateTemporaryPassword() {
  return crypto.randomBytes(5).toString("hex");
}

function isValidRole(role) {
  return ["student", "hod", "technician", "storeperson", "admin"].includes(
    role,
  );
}

async function getUserByEmail(email) {
  return User.findOne({
    email: normalizeEmail(email),
    active: true,
  });
}

async function getDepartmentHOD(department) {
  return User.findOne({
    role: "hod",
    department,
    active: true,
  });
}

async function getDepartmentTechnician(department) {
  return User.findOne({
    role: "technician",
    department,
    active: true,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    semester: user.semester,
    registerNumber: user.registerNumber,
    employeeId: user.employeeId,
    mustChangePassword: user.mustChangePassword,
  };
}

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.json({
    message: "BIT Stationery Portal API is running",
  });
});

/* =====================================================
   STUDENT REGISTRATION
===================================================== */

/* =====================================================
   STUDENT REGISTRATION
===================================================== */

app.post("/api/register/student", async (req, res) => {
  try {
    const { name, email, password, department, semester, registerNumber } =
      req.body;

    /* -----------------------------------------
       REQUIRED FIELDS
    ----------------------------------------- */

    if (
      !name ||
      !email ||
      !password ||
      !department ||
      !semester ||
      !registerNumber
    ) {
      return res.status(400).json({
        message: "All student registration fields are required.",
      });
    }

    /* -----------------------------------------
       COLLEGE EMAIL VALIDATION
       
       Example:
       abc.cs23@bitsathy.ac.in
    ----------------------------------------- */

    const normalizedEmail = normalizeEmail(email);

    const collegeEmailPattern = /^[a-z0-9._%+-]+@bitsathy\.ac\.in$/i;

    if (!collegeEmailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message:
          "Please use your valid college email ending with @bitsathy.ac.in.",
      });
    }

    /* -----------------------------------------
       NAME VALIDATION
    ----------------------------------------- */

    const studentName = String(name).trim();

    if (studentName.length < 2) {
      return res.status(400).json({
        message: "Please enter a valid student name.",
      });
    }

    /* -----------------------------------------
       PASSWORD VALIDATION
    ----------------------------------------- */

    const studentPassword = String(password);

    if (studentPassword.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    /* -----------------------------------------
       DEPARTMENT
    ----------------------------------------- */

    const departmentName = String(department).trim().toUpperCase();

    /*
     * These are the departments currently
     * supported by the portal.
     *
     * More departments can be added later.
     */

    const allowedDepartments = [
      "CSE",
      "ECE",
      "EEE",
      "MECH",
      "CIVIL",
      "IT",
      "AIDS",
      "AIML",
    ];

    if (!allowedDepartments.includes(departmentName)) {
      return res.status(400).json({
        message: "Please select a valid department.",
      });
    }

    /* -----------------------------------------
       SEMESTER
    ----------------------------------------- */

    const studentSemester = Number(semester);

    if (
      !Number.isInteger(studentSemester) ||
      studentSemester < 1 ||
      studentSemester > 8
    ) {
      return res.status(400).json({
        message: "Semester must be between 1 and 8.",
      });
    }

    /* -----------------------------------------
       REGISTER NUMBER
    ----------------------------------------- */

    const studentRegisterNumber = String(registerNumber).trim().toUpperCase();

    if (studentRegisterNumber.length < 4) {
      return res.status(400).json({
        message: "Please enter a valid register number.",
      });
    }

    /* -----------------------------------------
       EMAIL DUPLICATE CHECK
    ----------------------------------------- */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this college email already exists.",
      });
    }

    /* -----------------------------------------
       REGISTER NUMBER DUPLICATE CHECK
    ----------------------------------------- */

    const existingRegisterNumber = await User.findOne({
      registerNumber: studentRegisterNumber,
    });

    if (existingRegisterNumber) {
      return res.status(409).json({
        message: "This register number is already registered.",
      });
    }

    /* -----------------------------------------
       CREATE STUDENT
    ----------------------------------------- */

    const student = await User.create({
      name: studentName,

      email: normalizedEmail,

      password: studentPassword,

      role: "student",

      department: departmentName,

      semester: studentSemester,

      registerNumber: studentRegisterNumber,

      employeeId: null,

      mustChangePassword: false,

      active: true,
    });

    res.status(201).json({
      message: "Student account created successfully.",

      user: publicUser(student),
    });
  } catch (error) {
    console.error("Student registration error:", error);

    res.status(500).json({
      message: "Unable to register student.",
    });
  }
});

/* =====================================================
   LOGIN
===================================================== */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    res.json({
      message: "Login successful.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Unable to login.",
    });
  }
});

/* =====================================================
   CHANGE PASSWORD
===================================================== */

app.put("/api/users/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new passwords are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must contain at least 6 characters.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user || !user.active) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;

    await user.save();

    res.json({
      message: "Password changed successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Password change error:", error);

    res.status(500).json({
      message: "Unable to change password.",
    });
  }
});

/* =====================================================
   ADMIN — CREATE STAFF ACCOUNT
===================================================== */

app.post("/api/admin/staff", async (req, res) => {
  try {
    const { adminEmail, name, email, employeeId, department, role } = req.body;

    const admin = await getUserByEmail(adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can create staff accounts.",
      });
    }

    if (!name || !email || !employeeId || !department || !role) {
      return res.status(400).json({
        message: "All staff account fields are required.",
      });
    }

    if (!["hod", "technician", "storeperson"].includes(role)) {
      return res.status(400).json({
        message: "Admin can create HOD, Technician or Storeperson accounts.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const departmentName = String(department).trim().toUpperCase();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    const existingEmployee = await User.findOne({
      employeeId: String(employeeId).trim(),
    });

    if (existingEmployee) {
      return res.status(409).json({
        message: "This employee ID already exists.",
      });
    }

    if (role === "hod" || role === "technician") {
      const existingDepartmentRole = await User.findOne({
        department: departmentName,
        role,
        active: true,
      });

      if (existingDepartmentRole) {
        return res.status(409).json({
          message: `This department already has an active ${role}.`,
        });
      }
    }

    const temporaryPassword = generateTemporaryPassword();

    const staff = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role,
      department: departmentName,
      semester: null,
      registerNumber: null,
      employeeId: String(employeeId).trim(),
      mustChangePassword: true,
      active: true,
    });

    res.status(201).json({
      message: "Staff account created successfully.",
      temporaryPassword,
      user: publicUser(staff),
    });
  } catch (error) {
    console.error("Staff creation error:", error);

    res.status(500).json({
      message: "Unable to create staff account.",
    });
  }
});

/* =====================================================
   ADMIN — STAFF LIST
===================================================== */

app.get("/api/admin/staff", async (req, res) => {
  try {
    const admin = await getUserByEmail(req.query.adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can view staff.",
      });
    }

    const staff = await User.find({
      role: {
        $in: ["hod", "technician", "storeperson"],
      },
    }).sort({
      department: 1,
      role: 1,
    });

    res.json(staff.map(publicUser));
  } catch (error) {
    console.error("Staff list error:", error);

    res.status(500).json({
      message: "Unable to load staff.",
    });
  }
});

/* =====================================================
   STATIONERY — ALL ACTIVE PRODUCTS
===================================================== */

app.get("/api/stationery", async (req, res) => {
  try {
    const products = await Stationery.find({
      active: true,
    }).sort({
      source: 1,
      name: 1,
    });

    res.json(products);
  } catch (error) {
    console.error("Stationery list error:", error);

    res.status(500).json({
      message: "Unable to load stationery.",
    });
  }
});

/* =====================================================
   ADMIN — ADD STATIONERY
===================================================== */

app.post("/api/stationery", async (req, res) => {
  try {
    const { adminEmail, name, category, price, stock, lowStockLimit, source } =
      req.body;

    const admin = await getUserByEmail(adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can add stationery.",
      });
    }

    if (
      !name ||
      !category ||
      price === undefined ||
      stock === undefined ||
      !source
    ) {
      return res.status(400).json({
        message: "Product details are incomplete.",
      });
    }

    if (!["college", "store"].includes(source)) {
      return res.status(400).json({
        message: "Invalid product source.",
      });
    }

    const product = await Stationery.create({
      name: String(name).trim(),
      category: String(category).trim(),
      price: Number(price),
      stock: Number(stock),
      lowStockLimit: lowStockLimit === undefined ? 20 : Number(lowStockLimit),
      source,
      active: true,
    });

    res.status(201).json({
      message: "Stationery added successfully.",
      product,
    });
  } catch (error) {
    console.error("Add stationery error:", error);

    res.status(500).json({
      message: "Unable to add stationery.",
    });
  }
});

/* =====================================================
   ADMIN — UPDATE STATIONERY
===================================================== */

app.put("/api/stationery/:id", async (req, res) => {
  try {
    const { adminEmail, name, category, price, stock, lowStockLimit, active } =
      req.body;

    const admin = await getUserByEmail(adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can update stationery.",
      });
    }

    const product = await Stationery.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Stationery product not found.",
      });
    }

    if (name !== undefined) {
      product.name = String(name).trim();
    }

    if (category !== undefined) {
      product.category = String(category).trim();
    }

    if (price !== undefined) {
      product.price = Number(price);
    }

    if (stock !== undefined) {
      product.stock = Number(stock);
    }

    if (lowStockLimit !== undefined) {
      product.lowStockLimit = Number(lowStockLimit);
    }

    if (active !== undefined) {
      product.active = Boolean(active);
    }

    await product.save();

    res.json({
      message: "Stationery updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update stationery error:", error);

    res.status(500).json({
      message: "Unable to update stationery.",
    });
  }
});

/* =====================================================
   ADMIN — REMOVE STATIONERY
===================================================== */

app.delete("/api/stationery/:id", async (req, res) => {
  try {
    const admin = await getUserByEmail(req.query.adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can remove stationery.",
      });
    }

    const product = await Stationery.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Stationery product not found.",
      });
    }

    product.active = false;

    await product.save();

    res.json({
      message: "Stationery removed successfully.",
    });
  } catch (error) {
    console.error("Remove stationery error:", error);

    res.status(500).json({
      message: "Unable to remove stationery.",
    });
  }
});

/* =====================================================
   HOD — CREATE SEMESTER ASSIGNMENT
===================================================== */

app.post("/api/hod/assignments", async (req, res) => {
  try {
    const { hodEmail, semester, academicYear, items } = req.body;

    const hod = await getUserByEmail(hodEmail);

    if (!hod || hod.role !== "hod") {
      return res.status(403).json({
        message: "Only HOD can create an assignment.",
      });
    }

    if (
      !semester ||
      !academicYear ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Semester, academic year and products are required.",
      });
    }

    const validatedItems = [];

    for (const item of items) {
      const product = await Stationery.findOne({
        _id: item.stationeryId,
        source: "college",
        active: true,
      });

      if (!product) {
        return res.status(400).json({
          message:
            "One of the selected products is not a valid college product.",
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: "Product quantities must be positive whole numbers.",
        });
      }

      if (quantity > product.stock) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock.`,
        });
      }

      validatedItems.push({
        stationeryId: product._id,
        name: product.name,
        quantity,
      });
    }

    const existingDraft = await SemesterAssignment.findOne({
      department: hod.department,
      semester: Number(semester),
      academicYear: String(academicYear).trim(),
      finalized: false,
    });

    if (existingDraft) {
      return res.status(409).json({
        message: "A draft assignment already exists for this semester.",
      });
    }

    const assignment = await SemesterAssignment.create({
      department: hod.department,
      semester: Number(semester),
      academicYear: String(academicYear).trim(),
      items: validatedItems,
      createdBy: hod._id,
      finalized: false,
    });

    res.status(201).json({
      message: "Semester assignment created.",
      assignment,
    });
  } catch (error) {
    console.error("Assignment creation error:", error);

    res.status(500).json({
      message: "Unable to create semester assignment.",
    });
  }
});

/* =====================================================
   HOD — VIEW ASSIGNMENTS
===================================================== */

app.get("/api/hod/assignments", async (req, res) => {
  try {
    const hod = await getUserByEmail(req.query.hodEmail);

    if (!hod || hod.role !== "hod") {
      return res.status(403).json({
        message: "Only HOD can view assignments.",
      });
    }

    const assignments = await SemesterAssignment.find({
      department: hod.department,
    })
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      });

    res.json(assignments);
  } catch (error) {
    console.error("HOD assignment list error:", error);

    res.status(500).json({
      message: "Unable to load assignments.",
    });
  }
});

/* =====================================================
   HOD — FINALIZE ASSIGNMENT
===================================================== */

app.put("/api/hod/assignments/:id/finalize", async (req, res) => {
  try {
    const { hodEmail } = req.body;

    const hod = await getUserByEmail(hodEmail);

    if (!hod || hod.role !== "hod") {
      return res.status(403).json({
        message: "Only HOD can finalize an assignment.",
      });
    }

    const assignment = await SemesterAssignment.findOne({
      _id: req.params.id,
      department: hod.department,
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found.",
      });
    }

    if (assignment.finalized) {
      return res.status(400).json({
        message: "This assignment is already finalized.",
      });
    }

    const students = await User.find({
      role: "student",
      department: assignment.department,
      semester: assignment.semester,
      active: true,
    });

    if (students.length === 0) {
      return res.status(400).json({
        message: "No active students found for this department and semester.",
      });
    }

    const technician = await getDepartmentTechnician(assignment.department);

    if (!technician) {
      return res.status(400).json({
        message: "No active Technician is assigned to this department.",
      });
    }

    /*
     * Check stock for the complete department
     * before creating any distribution records.
     */

    for (const item of assignment.items) {
      const requiredTotal = item.quantity * students.length;

      const product = await Stationery.findById(item.stationeryId);

      if (!product) {
        return res.status(400).json({
          message: `${item.name} no longer exists.`,
        });
      }

      if (product.source !== "college") {
        return res.status(400).json({
          message: `${item.name} is not a college product.`,
        });
      }

      if (product.stock < requiredTotal) {
        return res.status(400).json({
          message: `Not enough ${item.name} stock. Required ${requiredTotal}, available ${product.stock}.`,
        });
      }
    }

    /*
     * Reduce college inventory.
     */

    for (const item of assignment.items) {
      const product = await Stationery.findById(item.stationeryId);

      product.stock -= item.quantity * students.length;

      await product.save();
    }

    /*
     * Create distribution records
     * for every student and every item.
     */

    const distributionRecords = [];

    for (const student of students) {
      for (const item of assignment.items) {
        distributionRecords.push({
          student: student._id,
          studentName: student.name,
          studentEmail: student.email,
          department: assignment.department,
          semester: assignment.semester,
          academicYear: assignment.academicYear,
          assignment: assignment._id,

          item: {
            stationeryId: item.stationeryId,
            name: item.name,
            quantity: item.quantity,
          },

          status: "Not Collected",
          receivedAt: null,
          receivedBy: null,
        });
      }
    }

    await Distribution.insertMany(distributionRecords);

    assignment.finalized = true;
    assignment.finalizedAt = new Date();

    await assignment.save();

    res.json({
      message: "Assignment finalized successfully.",
      studentCount: students.length,
      technician: publicUser(technician),
    });
  } catch (error) {
    console.error("Assignment finalization error:", error);

    res.status(500).json({
      message: "Unable to finalize assignment.",
    });
  }
});

/* =====================================================
   HOD — VIEW DEPARTMENT STUDENTS
===================================================== */

app.get("/api/hod/students", async (req, res) => {
  try {
    const hod = await getUserByEmail(req.query.hodEmail);

    if (!hod || hod.role !== "hod") {
      return res.status(403).json({
        message: "Only HOD can view department students.",
      });
    }

    const students = await User.find({
      role: "student",
      department: hod.department,
      active: true,
    }).sort({
      semester: 1,
      name: 1,
    });

    res.json(students.map(publicUser));
  } catch (error) {
    console.error("HOD student list error:", error);

    res.status(500).json({
      message: "Unable to load students.",
    });
  }
});

/* =====================================================
   HOD — VIEW PENDING DISTRIBUTION
===================================================== */

app.get("/api/hod/distribution", async (req, res) => {
  try {
    const hod = await getUserByEmail(req.query.hodEmail);

    if (!hod || hod.role !== "hod") {
      return res.status(403).json({
        message: "Only HOD can view distribution.",
      });
    }

    const records = await Distribution.find({
      department: hod.department,
    }).sort({
      semester: 1,
      studentName: 1,
    });

    res.json(records);
  } catch (error) {
    console.error("HOD distribution error:", error);

    res.status(500).json({
      message: "Unable to load distribution.",
    });
  }
});

/* =====================================================
   TECHNICIAN — VIEW DEPARTMENT DISTRIBUTION
===================================================== */

app.get("/api/technician/distribution", async (req, res) => {
  try {
    const technician = await getUserByEmail(req.query.technicianEmail);

    if (!technician || technician.role !== "technician") {
      return res.status(403).json({
        message: "Only Technician can view distribution.",
      });
    }

    const records = await Distribution.find({
      department: technician.department,
    }).sort({
      semester: 1,
      studentName: 1,
    });

    res.json(records);
  } catch (error) {
    console.error("Technician distribution error:", error);

    res.status(500).json({
      message: "Unable to load distribution.",
    });
  }
});

/* =====================================================
   TECHNICIAN — MARK ITEM RECEIVED
===================================================== */

app.put("/api/technician/distribution/:id/received", async (req, res) => {
  try {
    const { technicianEmail } = req.body;

    const technician = await getUserByEmail(technicianEmail);

    if (!technician || technician.role !== "technician") {
      return res.status(403).json({
        message: "Only Technician can mark distribution received.",
      });
    }

    const record = await Distribution.findOne({
      _id: req.params.id,
      department: technician.department,
    });

    if (!record) {
      return res.status(404).json({
        message: "Distribution record not found for this department.",
      });
    }

    if (record.status === "Received") {
      return res.status(400).json({
        message: "This item is already marked received.",
      });
    }

    record.status = "Received";
    record.receivedAt = new Date();
    record.receivedBy = technician._id;

    await record.save();

    /*
     * Check whether ALL items belonging
     * to this student and assignment
     * have now been received.
     */

    const remaining = await Distribution.countDocuments({
      student: record.student,
      assignment: record.assignment,
      status: "Not Collected",
    });

    let notificationCreated = false;

    if (remaining === 0) {
      const existingNotification = await Notification.findOne({
        type: "stationery_received",
        student: record.student,
        assignment: undefined,
      });

      /*
       * We intentionally create a fresh
       * notification for this completed
       * distribution.
       */

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await Notification.create({
        type: "stationery_received",

        title: "Stationery Received",

        message:
          "Your assigned college stationery has been completely received.",

        department: record.department,

        student: record.student,

        createdBy: technician._id,

        expiresAt,

        active: true,
      });

      notificationCreated = true;
    }

    res.json({
      message: "Item marked as received.",
      completed: remaining === 0,
      notificationCreated,
    });
  } catch (error) {
    console.error("Mark received error:", error);

    res.status(500).json({
      message: "Unable to update distribution.",
    });
  }
});

/* =====================================================
   TECHNICIAN — SEND TEMPORARY MESSAGE
===================================================== */

app.post("/api/technician/notifications", async (req, res) => {
  try {
    const { technicianEmail, title, message, expiresAt } = req.body;

    const technician = await getUserByEmail(technicianEmail);

    if (!technician || technician.role !== "technician") {
      return res.status(403).json({
        message: "Only Technician can send department notifications.",
      });
    }

    if (!title || !message || !expiresAt) {
      return res.status(400).json({
        message: "Title, message and expiry time are required.",
      });
    }

    const expiry = new Date(expiresAt);

    if (Number.isNaN(expiry.getTime())) {
      return res.status(400).json({
        message: "Invalid expiry time.",
      });
    }

    if (expiry <= new Date()) {
      return res.status(400).json({
        message: "Expiry time must be in the future.",
      });
    }

    const notification = await Notification.create({
      type: "technician_message",

      title: String(title).trim(),

      message: String(message).trim(),

      department: technician.department,

      student: null,

      createdBy: technician._id,

      expiresAt: expiry,

      active: true,
    });

    res.status(201).json({
      message: "Department notification published.",
      notification,
    });
  } catch (error) {
    console.error("Technician notification error:", error);

    res.status(500).json({
      message: "Unable to send notification.",
    });
  }
});

/* =====================================================
   TECHNICIAN — VIEW OWN ACTIVE MESSAGES
===================================================== */

app.get("/api/technician/notifications", async (req, res) => {
  try {
    const technician = await getUserByEmail(req.query.technicianEmail);

    if (!technician || technician.role !== "technician") {
      return res.status(403).json({
        message: "Only Technician can view notifications.",
      });
    }

    const notifications = await Notification.find({
      department: technician.department,
      createdBy: technician._id,
      type: "technician_message",
      active: true,
      expiresAt: {
        $gt: new Date(),
      },
    }).sort({
      createdAt: -1,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Technician notification list error:", error);

    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
});

/* =====================================================
   STUDENT — OWN DISTRIBUTION
===================================================== */

app.get("/api/student/distribution", async (req, res) => {
  try {
    const student = await getUserByEmail(req.query.studentEmail);

    if (!student || student.role !== "student") {
      return res.status(403).json({
        message: "Only students can view their distribution.",
      });
    }

    const records = await Distribution.find({
      student: student._id,
    }).sort({
      createdAt: -1,
    });

    res.json(records);
  } catch (error) {
    console.error("Student distribution error:", error);

    res.status(500).json({
      message: "Unable to load your distribution.",
    });
  }
});

/* =====================================================
   STUDENT — ACTIVE NOTIFICATIONS
===================================================== */

app.get("/api/student/notifications", async (req, res) => {
  try {
    const student = await getUserByEmail(req.query.studentEmail);

    if (!student || student.role !== "student") {
      return res.status(403).json({
        message: "Only students can view notifications.",
      });
    }

    const now = new Date();

    /*
     * Deactivate expired notifications.
     */

    await Notification.updateMany(
      {
        active: true,
        expiresAt: {
          $lte: now,
        },
      },
      {
        $set: {
          active: false,
        },
      },
    );

    /*
     * Student sees:
     *
     * 1. Their own stationery notification
     * 2. Department technician messages
     */

    const notifications = await Notification.find({
      active: true,
      expiresAt: {
        $gt: now,
      },

      $or: [
        {
          student: student._id,
        },

        {
          type: "technician_message",
          department: student.department,
          student: null,
        },
      ],
    }).sort({
      createdAt: -1,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Student notification error:", error);

    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
});

/* =====================================================
   STUDENT — STORE PRODUCTS
===================================================== */

app.get("/api/store/products", async (req, res) => {
  try {
    const products = await Stationery.find({
      source: "store",
      active: true,
    }).sort({
      name: 1,
    });

    res.json(products);
  } catch (error) {
    console.error("Store products error:", error);

    res.status(500).json({
      message: "Unable to load store products.",
    });
  }
});

/* =====================================================
   STUDENT — PLACE STORE ORDER
===================================================== */

app.post("/api/orders", async (req, res) => {
  try {
    const { studentEmail, items } = req.body;

    const student = await getUserByEmail(studentEmail);

    if (!student || student.role !== "student") {
      return res.status(403).json({
        message: "Only students can place store orders.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty.",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    /*
     * Validate every product and
     * calculate price from database.
     */

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: "Invalid product quantity.",
        });
      }

      const product = await Stationery.findOne({
        _id: item.stationeryId,
        source: "store",
        active: true,
      });

      if (!product) {
        return res.status(400).json({
          message: "One of the selected products is unavailable.",
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `${product.name} has only ${product.stock} available.`,
        });
      }

      orderItems.push({
        stationeryId: product._id,

        name: product.name,

        price: product.price,

        quantity,
      });

      totalAmount += product.price * quantity;
    }

    /*
     * Reduce store stock.
     */

    for (const item of orderItems) {
      const updatedProduct = await Stationery.findOneAndUpdate(
        {
          _id: item.stationeryId,

          source: "store",

          active: true,

          stock: {
            $gte: item.quantity,
          },
        },

        {
          $inc: {
            stock: -item.quantity,
          },
        },

        {
          new: true,
        },
      );

      if (!updatedProduct) {
        return res.status(409).json({
          message: "Stock changed while placing the order. Please try again.",
        });
      }
    }

    const order = await Order.create({
      student: student._id,

      studentEmail: student.email,

      items: orderItems,

      totalAmount,

      status: "Pending",

      processedBy: null,

      processedAt: null,
    });

    res.status(201).json({
      message: "Store order placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);

    res.status(500).json({
      message: "Unable to place order.",
    });
  }
});

/* =====================================================
   STUDENT — OWN ORDERS
===================================================== */

app.get("/api/orders/student", async (req, res) => {
  try {
    const student = await getUserByEmail(req.query.studentEmail);

    if (!student || student.role !== "student") {
      return res.status(403).json({
        message: "Only students can view their orders.",
      });
    }

    const orders = await Order.find({
      student: student._id,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error("Student orders error:", error);

    res.status(500).json({
      message: "Unable to load orders.",
    });
  }
});

/* =====================================================
   STOREPERSON — VIEW ORDERS
===================================================== */

app.get("/api/storeperson/orders", async (req, res) => {
  try {
    const storeperson = await getUserByEmail(req.query.storepersonEmail);

    if (!storeperson || storeperson.role !== "storeperson") {
      return res.status(403).json({
        message: "Only Storeperson can view orders.",
      });
    }

    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error("Storeperson orders error:", error);

    res.status(500).json({
      message: "Unable to load store orders.",
    });
  }
});

/* =====================================================
   STOREPERSON — UPDATE ORDER
===================================================== */

app.put("/api/storeperson/orders/:id/status", async (req, res) => {
  try {
    const { storepersonEmail, status } = req.body;

    const storeperson = await getUserByEmail(storepersonEmail);

    if (!storeperson || storeperson.role !== "storeperson") {
      return res.status(403).json({
        message: "Only Storeperson can update orders.",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Ready",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const transitions = {
      Pending: ["Processing", "Cancelled"],

      Processing: ["Ready", "Cancelled"],

      Ready: ["Completed"],

      Completed: [],

      Cancelled: [],
    };

    if (!transitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change order from ${order.status} to ${status}.`,
      });
    }

    order.status = status;
    order.processedBy = storeperson._id;
    order.processedAt = new Date();

    await order.save();

    res.json({
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    console.error("Order status error:", error);

    res.status(500).json({
      message: "Unable to update order.",
    });
  }
});

/* =====================================================
   ADMIN — OVERVIEW
===================================================== */

app.get("/api/admin/overview", async (req, res) => {
  try {
    const admin = await getUserByEmail(req.query.adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can view the overview.",
      });
    }

    const products = await Stationery.find({
      active: true,
    });

    const distributions = await Distribution.find();

    const orders = await Order.find();

    const students = await User.countDocuments({
      role: "student",
      active: true,
    });

    const staff = await User.countDocuments({
      role: {
        $in: ["hod", "technician", "storeperson"],
      },
      active: true,
    });

    const totalStock = products.reduce(
      (sum, product) => sum + product.stock,
      0,
    );

    const lowStockCount = products.filter(
      (product) => product.stock <= product.lowStockLimit,
    ).length;

    const collegeProducts = products.filter(
      (product) => product.source === "college",
    );

    const storeProducts = products.filter(
      (product) => product.source === "store",
    );

    res.json({
      productCount: products.length,

      collegeProductCount: collegeProducts.length,

      storeProductCount: storeProducts.length,

      totalStock,

      collegeStock: collegeProducts.reduce(
        (sum, product) => sum + product.stock,
        0,
      ),

      storeStock: storeProducts.reduce(
        (sum, product) => sum + product.stock,
        0,
      ),

      lowStockCount,

      totalStudents: students,

      totalStaff: staff,

      collegeReceived: distributions.filter(
        (item) => item.status === "Received",
      ).length,

      collegePending: distributions.filter(
        (item) => item.status === "Not Collected",
      ).length,

      storePending: orders.filter((order) => order.status === "Pending").length,

      storeProcessing: orders.filter((order) => order.status === "Processing")
        .length,

      storeReady: orders.filter((order) => order.status === "Ready").length,

      storeCompleted: orders.filter((order) => order.status === "Completed")
        .length,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    res.status(500).json({
      message: "Unable to load admin overview.",
    });
  }
});

/* =====================================================
   ADMIN — ALL DISTRIBUTION
===================================================== */

app.get("/api/admin/distribution", async (req, res) => {
  try {
    const admin = await getUserByEmail(req.query.adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can view distribution.",
      });
    }

    const records = await Distribution.find().sort({
      department: 1,
      semester: 1,
      studentName: 1,
    });

    res.json(records);
  } catch (error) {
    console.error("Admin distribution error:", error);

    res.status(500).json({
      message: "Unable to load distribution.",
    });
  }
});

/* =====================================================
   ADMIN — ALL ORDERS
===================================================== */

app.get("/api/admin/orders", async (req, res) => {
  try {
    const admin = await getUserByEmail(req.query.adminEmail);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only Admin can view orders.",
      });
    }

    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error("Admin orders error:", error);

    res.status(500).json({
      message: "Unable to load orders.",
    });
  }
});

/* =====================================================
   START SERVER
===================================================== */

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);

    process.exit(1);
  }
}

startServer();
