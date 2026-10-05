const mongoose = require("mongoose");
const { MOVEMENT_TYPES } = require("../Utils/stockConstants");

// Audit log entry for every change to a product's stock quantity
const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"]
    },
    type: {
      type: String,
      enum: Object.values(MOVEMENT_TYPES),
      required: [true, "Movement type is required"]
    },
    // Number of units moved (always positive; direction comes from type)
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"]
    },
    previousQuantity: {
      type: Number,
      required: true
    },
    newQuantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    // External reference such as a purchase order or invoice number
    reference: {
      type: String,
      trim: true
    },
    note: {
      type: String,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

module.exports =
  mongoose.models.StockMovement || mongoose.model("StockMovement", stockMovementSchema);
