require("dotenv").config();

const app = require("./app");
const connectDB = require("./Config/Database"); // Ensure filename matches your disk ('db.js' or 'Database.js')

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // Connect to database before accepting incoming HTTP requests
    await connectDB();
    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();