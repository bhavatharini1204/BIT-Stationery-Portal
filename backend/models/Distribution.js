const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    studentEmail: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    academicYear: {
      type: String,
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SemesterAssignment",
      required: true,
    },

    item: {
      stationeryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stationery",
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    status: {
      type: String,
      enum: ["Not Collected", "Received"],
      default: "Not Collected",
    },

    receivedAt: {
      type: Date,
      default: null,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Distribution", distributionSchema);
