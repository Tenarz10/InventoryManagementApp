

require("dotenv").config();

const app = require("./app");
const connectDB = require("./Config/Database");
const { MIN_JWT_SECRET_LENGTH } = require("./Utils/authConstants");

const PORT = process.env.PORT || 5500;

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET must be set in the environment");
    }

    if (process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
      const message = `JWT_SECRET should be at least ${MIN_JWT_SECRET_LENGTH} characters`;

      if (process.env.NODE_ENV === "production") throw new Error(message);
      console.warn(`Warning: ${message}`);
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();