const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "stationery_received",
        "technician_message",
        "hod_allotment",
        "storeperson_dispatch",
        "order_update",
      ],
    },

    targetRole: {
      type: String,
      enum: ["student", "technician", "storeperson", "all"],
      default: "student",
    },

    alertLevel: {
      type: String,
      enum: ["heavy_crowd", "moderate", "normal", "info"],
      default: "info",
    },

    timeSlot: {
      type: String,
      default: null,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
