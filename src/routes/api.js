const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

// Health check and status
router.get("/status", eventController.getStatus);

// Get recent batches of CDC events
router.get("/batches", eventController.getRecentBatches);

// For testing purposes: simulate an event insertion
router.post("/simulate", eventController.simulateEvent);

// Reload the debouncing configuration
router.post("/reload-config", eventController.reloadConfig);

module.exports = router;
