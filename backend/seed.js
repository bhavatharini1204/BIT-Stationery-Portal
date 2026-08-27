const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Stationery = require("./models/Stationery");
const SemesterAssignment = require("./models/SemesterAssignment");
const Distribution = require("./models/Distribution");
const Notification = require("./models/Notification");
const Order = require("./models/Order");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected for seeding.");

    // ==========================================
    // CLEAR OLD DATA
    // ==========================================

    await User.deleteMany({});
    await Stationery.deleteMany({});
    await SemesterAssignment.deleteMany({});
    await Distribution.deleteMany({});
    await Notification.deleteMany({});
    await Order.deleteMany({});

    console.log("Old data cleared.");

    // ==========================================
    // ADMIN
    // ==========================================

    const admin = await User.create({
      name: "System Admin",
      email: "admin@bit.edu",
      password: "BIT@12345",
      role: "admin",
      department: "ADMIN",
      semester: null,
      registerNumber: null,
      employeeId: "ADMIN001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // STOREPERSON
    // ==========================================

    const storeperson = await User.create({
      name: "Campus Storeperson",
      email: "store@bit.edu",
      password: "BIT@12345",
      role: "storeperson",
      department: "STORE",
      semester: null,
      registerNumber: null,
      employeeId: "STORE001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // CSE HOD
    // ==========================================

    const cseHod = await User.create({
      name: "CSE HOD",
      email: "cse.hod@bit.edu",
      password: "BIT@12345",
      role: "hod",
      department: "CSE",
      semester: null,
      registerNumber: null,
      employeeId: "CSE-HOD-001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // CSE TECHNICIAN
    // ==========================================

    const cseTechnician = await User.create({
      name: "CSE Technician",
      email: "cse.tech@bit.edu",
      password: "BIT@12345",
      role: "technician",
      department: "CSE",
      semester: null,
      registerNumber: null,
      employeeId: "CSE-TECH-001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // ECE HOD
    // ==========================================

    const eceHod = await User.create({
      name: "ECE HOD",
      email: "ece.hod@bit.edu",
      password: "BIT@12345",
      role: "hod",
      department: "ECE",
      semester: null,
      registerNumber: null,
      employeeId: "ECE-HOD-001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // ECE TECHNICIAN
    // ==========================================

    const eceTechnician = await User.create({
      name: "ECE Technician",
      email: "ece.tech@bit.edu",
      password: "BIT@12345",
      role: "technician",
      department: "ECE",
      semester: null,
      registerNumber: null,
      employeeId: "ECE-TECH-001",
      mustChangePassword: false,
      active: true,
    });

    // ==========================================
    // CSE STUDENTS
    // ==========================================

    await User.insertMany([
      {
        name: "CSE Student One",
        email: "cse.student1@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "CSE",
        semester: 5,
        registerNumber: "CSE2026001",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },

      {
        name: "CSE Student Two",
        email: "cse.student2@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "CSE",
        semester: 5,
        registerNumber: "CSE2026002",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },

      {
        name: "CSE Student Three",
        email: "cse.student3@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "CSE",
        semester: 5,
        registerNumber: "CSE2026003",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
    ]);

    // ==========================================
    // ECE STUDENTS
    // ==========================================

    await User.insertMany([
      {
        name: "ECE Student One",
        email: "ece.student1@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "ECE",
        semester: 5,
        registerNumber: "ECE2026001",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },

      {
        name: "ECE Student Two",
        email: "ece.student2@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "ECE",
        semester: 5,
        registerNumber: "ECE2026002",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },

      {
        name: "ECE Student Three",
        email: "ece.student3@bit.edu",
        password: "BIT@12345",
        role: "student",
        department: "ECE",
        semester: 5,
        registerNumber: "ECE2026003",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
    ]);

    // ==========================================
    // COLLEGE PRODUCTS
    // ==========================================

    await Stationery.insertMany([
      {
        name: "College Notebook",
        category: "Academic",
        price: 0,
        stock: 100,
        lowStockLimit: 20,
        source: "college",
        active: true,
      },

      {
        name: "Record Note",
        category: "Academic",
        price: 0,
        stock: 100,
        lowStockLimit: 20,
        source: "college",
        active: true,
      },

      {
        name: "Drawing Sheet",
        category: "Academic",
        price: 0,
        stock: 200,
        lowStockLimit: 30,
        source: "college",
        active: true,
      },
    ]);

    // ==========================================
    // STORE PRODUCTS
    // ==========================================

    await Stationery.insertMany([
      {
        name: "Blue Pen",
        category: "Writing",
        price: 10,
        stock: 100,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },

      {
        name: "Black Pen",
        category: "Writing",
        price: 10,
        stock: 100,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },

      {
        name: "File",
        category: "Office",
        price: 25,
        stock: 80,
        lowStockLimit: 15,
        source: "store",
        active: true,
      },

      {
        name: "Pencil",
        category: "Writing",
        price: 5,
        stock: 150,
        lowStockLimit: 25,
        source: "store",
        active: true,
      },
    ]);

    // ==========================================
    // DISPLAY LOGIN INFORMATION
    // ==========================================

    console.log("");
    console.log("======================================");
    console.log("      BIT PORTAL TEST ACCOUNTS");
    console.log("======================================");

    console.log("Admin:");
    console.log("admin@bit.edu / BIT@12345");

    console.log("");

    console.log("Storeperson:");
    console.log("store@bit.edu / BIT@12345");

    console.log("");

    console.log("CSE HOD:");
    console.log("cse.hod@bit.edu / BIT@12345");

    console.log("");

    console.log("CSE Technician:");
    console.log("cse.tech@bit.edu / BIT@12345");

    console.log("");

    console.log("ECE HOD:");
    console.log("ece.hod@bit.edu / BIT@12345");

    console.log("");

    console.log("ECE Technician:");
    console.log("ece.tech@bit.edu / BIT@12345");

    console.log("");

    console.log("CSE Students:");
    console.log("cse.student1@bit.edu");
    console.log("cse.student2@bit.edu");
    console.log("cse.student3@bit.edu");

    console.log("");

    console.log("ECE Students:");
    console.log("ece.student1@bit.edu");
    console.log("ece.student2@bit.edu");
    console.log("ece.student3@bit.edu");

    console.log("Password for all:");
    console.log("BIT@12345");

    console.log("======================================");

    await mongoose.connection.close();

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed error:", error);

    await mongoose.connection.close();

    process.exit(1);
  }
}

seed();
