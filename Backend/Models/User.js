const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  ROLES,
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH
} = require("../Utils/authConstants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    // Stored as a bcrypt hash; excluded from queries unless selected explicitly
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STAFF
    },
    // Deactivated accounts cannot log in and their tokens stop working
    isActive: {
      type: Boolean,
      default: true
    },
    // Stored in every token; incrementing it revokes all of the user's existing tokens
    tokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    lastLoginAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Hash the password whenever it is set or changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
