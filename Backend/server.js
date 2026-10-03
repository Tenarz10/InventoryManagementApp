

require("dotenv").config();

const app = require("./app");
const connectDB = require("./Config/Database");

const PORT = process.env.PORT || 5500;

const startServer = async () => {
  try {
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