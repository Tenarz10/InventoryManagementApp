const mongoose = require("mongoose");
const { STOCK_STATUS, DEFAULT_REORDER_LEVEL } = require("../Utils/stockConstants");

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number"
};

const stockSchema = new mongoose.Schema(
  {
    // One stock record per product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      unique: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Quantity cannot be negative"],
      validate: wholeNumber
    },
    // At or below this quantity the product needs restocking
    reorderLevel: {
      type: Number,
      default: DEFAULT_REORDER_LEVEL,
      min: [0, "Reorder level cannot be negative"],
      validate: wholeNumber
    },
    // Optional upper limit; 0 or unset means no limit
    maxLevel: {
      type: Number,
      min: [0, "Max level cannot be negative"],
      validate: [
        wholeNumber,
        {
          validator: function (value) {
            return !value || value >= this.reorderLevel;
          },
          message: "Max level must be greater than or equal to reorder level"
        }
      ]
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    lastRestockedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

stockSchema.virtual("status").get(function () {
  if (this.quantity === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (this.quantity <= this.reorderLevel) return STOCK_STATUS.LOW_STOCK;
  if (this.maxLevel && this.quantity > this.maxLevel) return STOCK_STATUS.OVERSTOCKED;
  return STOCK_STATUS.IN_STOCK;
});

module.exports = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
