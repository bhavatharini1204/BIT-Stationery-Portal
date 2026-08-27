const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentEmail: {
      type: String,
      required: true,
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

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
