const mongoose = require("mongoose");

const semesterAssignmentSchema = new mongoose.Schema(
  {
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
      trim: true,
    },

    items: [
      {
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
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    finalized: {
      type: Boolean,
      default: false,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    dispatchStatus: {
      type: String,
      enum: ["Pending Dispatch", "Dispatched to Department", "Received by Technician"],
      default: "Pending Dispatch",
    },

    dispatchedAt: {
      type: Date,
      default: null,
    },

    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SemesterAssignment", semesterAssignmentSchema);
