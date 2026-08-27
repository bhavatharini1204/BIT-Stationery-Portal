const mongoose = require("mongoose");

const stationerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lowStockLimit: {
      type: Number,
      min: 0,
      default: 20,
    },

    source: {
      type: String,
      required: true,
      enum: ["college", "store"],
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

module.exports = mongoose.model("Stationery", stationerySchema);
