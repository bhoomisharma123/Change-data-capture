require("dotenv").config();
const express = require("express");
const { connectDB, closeDB } = require("./config/database");
const { setupCDC, closeCDC } = require("./services/cdcService");
const apiRoutes = require("./routes/api");

const app = express();
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
let server;
let changeStream;
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);

  try {
    await closeCDC(changeStream);
    await closeDB();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    console.log("[Server] Shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("[Server] Error during shutdown:", error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB successfully.");

    // 2. Set up CDC Change Streams
    changeStream = setupCDC();

    // 3. Start Express server
    server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
