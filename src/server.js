require("dotenv").config();
const express = require("express");
const path = require("path");
const { connectDB, getClient } = require("./config/database");
const { setupCDC } = require("./services/cdcService");
const apiRoutes = require("./routes/api");

const app = express();
app.use(express.json());

// Serve static UI assets
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB successfully.");

    // 2. Set up CDC Change Streams
    setupCDC();

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    // 4. Graceful Shutdown handlers
    const shutdown = async () => {
      console.log("\n[Server] Shutting down gracefully...");
      server.close();
      const client = getClient();
      if (client) {
        await client.close();
        console.log("[MongoDB] Connection closed.");
      }
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
