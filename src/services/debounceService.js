const fs = require("fs");
const path = require("path");

// Load configuration logic
const configPath = path.join(__dirname, "../../config/app-config.json");
let appConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Simulated Debounce mechanism
class DebounceService {
  constructor() {
    this.eventBuffer = [];
    this.debounceTimer = null;
    this.processedBatches = []; // Keep a short history for API monitoring
  }

  // Reload config (simulated for inotify)
  reloadConfig() {
    try {
      appConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("✅ Configuration reloaded automatically:", appConfig);
    } catch (e) {
      console.error("Failed to reload config", e);
    }
  }

  getConfig() {
    return appConfig;
  }

  addEvent(event) {
    this.eventBuffer.push({
      eventId: event._id ? (event._id._data || "unknown") : "unknown",
      operationType: event.operationType,
      ns: event.ns,
      documentKey: event.documentKey,
      fullDocument: event.fullDocument || null,
      updateDescription: event.updateDescription || null,
      timestamp: new Date().toISOString()
    });

    const { debounceIntervalMs, maxBatchSize } = this.getConfig();

    // Clear existing timer if any
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Process immediately if batch size limit reached
    if (this.eventBuffer.length >= maxBatchSize) {
      console.log(`[DebounceService] Max batch size (${maxBatchSize}) reached. Processing immediately.`);
      this.processEvents();
      return;
    }

    // Otherwise, delay processing (Debounce)
    this.debounceTimer = setTimeout(() => {
      console.log(`[DebounceService] Quiet period of ${debounceIntervalMs}ms elapsed. Processing batch.`);
      this.processEvents();
    }, debounceIntervalMs);
  }

  processEvents() {
    if (this.eventBuffer.length === 0) return;

    // Simulate batch processing (e.g., sending to another API, saving to data warehouse)
    console.log(`\n🚀 [BATCH PROCESSED] Extracting ${this.eventBuffer.length} events...`);
    
    // Save batch to history for API to expose
    const currentBatch = {
      processedAt: new Date().toISOString(),
      eventCount: this.eventBuffer.length,
      events: [...this.eventBuffer]
    };
    
    this.processedBatches.unshift(currentBatch);
    if (this.processedBatches.length > 10) {
      // Keep only last 10 batches in memory
      this.processedBatches.pop();
    }

    // E.g. Send currentBatch to external service

    // Clear buffer
    this.eventBuffer = [];
    this.debounceTimer = null;
    console.log(`✅ Batch processing complete. Waiting for new changes...\n`);
  }

  getStatus() {
    return {
      bufferedEvents: this.eventBuffer.length,
      isTimerActive: !!this.debounceTimer,
      config: this.getConfig(),
      recentBatches: this.processedBatches.length
    };
  }
}

const debounceService = new DebounceService();

module.exports = debounceService;
