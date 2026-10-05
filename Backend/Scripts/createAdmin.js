require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../Models/User");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Check if an admin already exists
    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("An admin account already exists.");
      console.log(`Admin email: ${existingAdmin.email}`);

      await mongoose.connection.close();
      process.exit(0);
    }

    // Create first admin
    const admin = await User.create({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
    isActive: true,
  });

    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log("=================================");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:");
    console.error(error.message);

    await mongoose.connection.close();

    process.exit(1);
  }
};

createAdmin();