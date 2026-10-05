const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
    {
        supplierName:{
            type: String,
            required: [true, "Supplier name is required"],
            trim: true,
        },

        contactPerson: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            set: (value) =>
                typeof value === "string" && value.trim() === ""
                    ? undefined
                    : value,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address",
            ],
         },

        phone: {
            type: String,
            trim: true,
        },

        address: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Supplier", supplierSchema);
