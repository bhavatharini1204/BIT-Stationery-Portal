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
    console.log("Connected to MongoDB for seeding.");

    // Clear old data
    await User.deleteMany({});
    await Stationery.deleteMany({});
    await SemesterAssignment.deleteMany({});
    await Distribution.deleteMany({});
    await Notification.deleteMany({});
    await Order.deleteMany({});

    console.log("Existing collections cleared.");

    const DEFAULT_PASSWORD = "BIT@12345";

    // 1. ADMIN
    const admin = await User.create({
      name: "Dean Academic Admin",
      email: "admin@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "admin",
      department: "ADMIN",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-ADM-01",
      mustChangePassword: false,
      active: true,
    });

    // 2. STOREPERSONS (Campus Central Store)
    const storeperson1 = await User.create({
      name: "S. Ramanathan",
      email: "store@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "storeperson",
      department: "STORE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-STR-01",
      mustChangePassword: false,
      active: true,
    });

    // 3. CSE DEPARTMENT STAFF
    const cseHod = await User.create({
      name: "Dr. K. Senthil Kumar (HOD CSE)",
      email: "cse.hod@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "hod",
      department: "CSE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-CSE-HOD",
      mustChangePassword: false,
      active: true,
    });

    const cseTech1 = await User.create({
      name: "M. Ramesh (Lab In-charge)",
      email: "cse.tech1@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "technician",
      department: "CSE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-CSE-TC01",
      mustChangePassword: false,
      active: true,
    });

    const cseTech2 = await User.create({
      name: "P. Vignesh (Network Lab Tech)",
      email: "cse.tech2@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "technician",
      department: "CSE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-CSE-TC02",
      mustChangePassword: false,
      active: true,
    });

    // 4. ECE DEPARTMENT STAFF
    const eceHod = await User.create({
      name: "Dr. M. Deepa (HOD ECE)",
      email: "ece.hod@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "hod",
      department: "ECE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-ECE-HOD",
      mustChangePassword: false,
      active: true,
    });

    const eceTech = await User.create({
      name: "T. Suresh (VLSI Lab Tech)",
      email: "ece.tech@bitsathy.ac.in",
      password: DEFAULT_PASSWORD,
      role: "technician",
      department: "ECE",
      semester: null,
      registerNumber: null,
      employeeId: "BIT-ECE-TC01",
      mustChangePassword: false,
      active: true,
    });

    // 5. STUDENTS ACROSS ALL 4 YEARS
    const students = await User.insertMany([
      // Year 1 (Sem 1) CSE
      {
        name: "Arun Prakash S",
        email: "arun.cs26@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "CSE",
        semester: 1,
        registerNumber: "7376261CS101",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
      // Year 2 (Sem 3) CSE
      {
        name: "Divya Bharathi M",
        email: "divya.cs25@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "CSE",
        semester: 3,
        registerNumber: "7376251CS102",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
      // Year 3 (Sem 5) CSE
      {
        name: "Karthik Raja V",
        email: "karthik.cs24@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "CSE",
        semester: 5,
        registerNumber: "7376241CS103",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
      {
        name: "Bhavatharini K",
        email: "bhavatharini.cs23@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "CSE",
        semester: 5,
        registerNumber: "7376231CS104",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
      // Year 4 (Sem 7) CSE
      {
        name: "Praveen Kumar N",
        email: "praveen.cs23@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "CSE",
        semester: 7,
        registerNumber: "7376231CS105",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
      // Year 2 (Sem 3) ECE
      {
        name: "Sanjay Kumar R",
        email: "sanjay.ec25@bitsathy.ac.in",
        password: DEFAULT_PASSWORD,
        role: "student",
        department: "ECE",
        semester: 3,
        registerNumber: "7376251EC201",
        employeeId: null,
        mustChangePassword: false,
        active: true,
      },
    ]);

    // 6. COLLEGE ALLOCATED STATIONERY (Supplied free to students via HOD allotment)
    const collegeStationery = await Stationery.insertMany([
      {
        name: "BIT Laboratory Observation Book (120 Pgs)",
        category: "Academic",
        price: 0,
        stock: 500,
        lowStockLimit: 50,
        source: "college",
        active: true,
      },
      {
        name: "BIT Academic Long Notebook (Unruled, 192 Pgs)",
        category: "Academic",
        price: 0,
        stock: 400,
        lowStockLimit: 40,
        source: "college",
        active: true,
      },
      {
        name: "Engineering Physics & Chemistry Record Note",
        category: "Academic",
        price: 0,
        stock: 350,
        lowStockLimit: 30,
        source: "college",
        active: true,
      },
      {
        name: "Engineering Graphics Drawing Sheet Folder (A3)",
        category: "Graphics",
        price: 0,
        stock: 250,
        lowStockLimit: 25,
        source: "college",
        active: true,
      },
      {
        name: "Engineering Mini Drafter & Board Clips",
        category: "Graphics",
        price: 0,
        stock: 180,
        lowStockLimit: 20,
        source: "college",
        active: true,
      },
      {
        name: "Data Structures & Algorithms Lab Observation Manual",
        category: "Academic",
        price: 0,
        stock: 300,
        lowStockLimit: 30,
        source: "college",
        active: true,
      },
    ]);

    // 7. CAMPUS STORE STATIONERY (Retail items purchased by students)
    const storeStationery = await Stationery.insertMany([
      {
        name: "Cello Gripper Blue Ballpoint Pen (Pack of 5)",
        category: "Writing",
        price: 50,
        stock: 250,
        lowStockLimit: 25,
        source: "store",
        active: true,
      },
      {
        name: "Camlin Engineering Pencil Set (2H, H, HB, 2B)",
        category: "Writing",
        price: 45,
        stock: 200,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },
      {
        name: "Casio FX-991CW Scientific Calculator",
        category: "Instruments",
        price: 1250,
        stock: 60,
        lowStockLimit: 10,
        source: "store",
        active: true,
      },
      {
        name: "A4 Project Work Spiral Binding Cover & Sheet Pack (50 Pgs)",
        category: "Projects",
        price: 75,
        stock: 150,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },
      {
        name: "Camlin Geometry & Drafter Scale Set (30cm)",
        category: "Instruments",
        price: 65,
        stock: 180,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },
      {
        name: "Highlighter Fluorescent Marker Set (4 Colors)",
        category: "Writing",
        price: 80,
        stock: 120,
        lowStockLimit: 15,
        source: "store",
        active: true,
      },
      {
        name: "Exam Writing Pad with College Clip",
        category: "Office",
        price: 90,
        stock: 140,
        lowStockLimit: 20,
        source: "store",
        active: true,
      },
      {
        name: "BIT College Lanyard & ID Card Holder",
        category: "Office",
        price: 40,
        stock: 300,
        lowStockLimit: 30,
        source: "store",
        active: true,
      },
    ]);

    // 8. SAMPLE HOD ALLOTMENT FOR CSE SEMESTER 5
    const cseSem5Students = students.filter(
      (s) => s.department === "CSE" && s.semester === 5,
    );

    const cseAssignment = await SemesterAssignment.create({
      department: "CSE",
      semester: 5,
      academicYear: "2026-27",
      items: [
        {
          stationeryId: collegeStationery[0]._id,
          name: collegeStationery[0].name,
          quantity: 2,
        },
        {
          stationeryId: collegeStationery[1]._id,
          name: collegeStationery[1].name,
          quantity: 3,
        },
        {
          stationeryId: collegeStationery[5]._id,
          name: collegeStationery[5].name,
          quantity: 1,
        },
      ],
      createdBy: cseHod._id,
      finalized: true,
      finalizedAt: new Date(),
      dispatchStatus: "Dispatched to Department",
      dispatchedAt: new Date(),
      dispatchedBy: storeperson1._id,
    });

    // Deduct stock for the 2 students
    collegeStationery[0].stock -= 2 * cseSem5Students.length;
    await collegeStationery[0].save();
    collegeStationery[1].stock -= 3 * cseSem5Students.length;
    await collegeStationery[1].save();
    collegeStationery[5].stock -= 1 * cseSem5Students.length;
    await collegeStationery[5].save();

    // Create distribution records for CSE Sem 5 students
    for (const student of cseSem5Students) {
      for (const item of cseAssignment.items) {
        await Distribution.create({
          student: student._id,
          studentName: student.name,
          studentEmail: student.email,
          department: "CSE",
          semester: 5,
          academicYear: "2026-27",
          assignment: cseAssignment._id,
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

    // 9. SAMPLE BROADCAST CROWD ALERT FROM TECHNICIAN
    await Notification.create({
      type: "technician_message",
      targetRole: "student",
      alertLevel: "moderate",
      timeSlot: "2:00 PM - 4:30 PM",
      title: "Semester 5 Stationery Distribution Open",
      message:
        "CSE Semester 5 students can collect your assigned stationery package from Network Lab (Hall 302). Moderate crowd expected. Please bring your college ID.",
      department: "CSE",
      student: null,
      createdBy: cseTech1._id,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      active: true,
    });

    // 10. SAMPLE NOTIFICATION FOR STOREPERSON
    await Notification.create({
      type: "hod_allotment",
      targetRole: "storeperson",
      title: "College Allotment: CSE (Sem 5)",
      message:
        "HOD finalized allotment for 2 students. Materials prepared and dispatched.",
      department: "CSE",
      student: null,
      createdBy: cseHod._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
    });

    console.log("\n========================================================");
    console.log("       BIT STATIONERY PORTAL — TEST CREDENTIALS");
    console.log("========================================================");
    console.log("Admin:        admin@bitsathy.ac.in      | BIT@12345");
    console.log("Storeperson:  store@bitsathy.ac.in      | BIT@12345");
    console.log("CSE HOD:      cse.hod@bitsathy.ac.in    | BIT@12345");
    console.log("CSE Tech:     cse.tech1@bitsathy.ac.in  | BIT@12345");
    console.log("ECE HOD:      ece.hod@bitsathy.ac.in    | BIT@12345");
    console.log("ECE Tech:     ece.tech@bitsathy.ac.in   | BIT@12345");
    console.log("Student:      karthik.cs24@bitsathy.ac.in | BIT@12345 (Sem 5)");
    console.log("Student:      arun.cs26@bitsathy.ac.in    | BIT@12345 (Sem 1)");
    console.log("Student:      bhavatharini.cs23@bitsathy.ac.in | BIT@12345 (Sem 5)");
    console.log("========================================================\n");

    await mongoose.connection.close();
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
