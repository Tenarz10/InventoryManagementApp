// Creates the first admin account, or promotes an existing account to admin.
// Usage: set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env, then run `npm run create-admin`.
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../Models/User");
const { ROLES } = require("../Utils/authConstants");
const { validateCreateUser } = require("../Validators/userValidator");

const run = async () => {
  const body = {
    name: process.env.ADMIN_NAME || "Administrator",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  };

  validateCreateUser({ body }, {}, (error) => {
    if (error) {
      throw new Error(`Invalid admin details: ${error.details.join(", ")}`);
    }
  });

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: body.email.toLowerCase() });

  if (existing) {
    // The password is left alone so this never overwrites a real user's credentials
    existing.role = ROLES.ADMIN;
    existing.isActive = true;
    await existing.save();
    console.log(`Promoted ${existing.email} to admin`);
  } else {
    const admin = await User.create({ ...body, role: ROLES.ADMIN });
    console.log(`Created admin account ${admin.email}`);
  }
};

run()
  .catch((error) => {
    console.error(`Could not create admin: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
