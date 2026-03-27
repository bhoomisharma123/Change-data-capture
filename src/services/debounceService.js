const fs = require("fs");
const path = require("path");

// Load configuration logic
const configPath = path.join(__dirname, "../../config/app-config.json");
const defaultConfig = {
  debounceIntervalMs: 5000,
  targetCollection: "users",
  maxBatchSize: 100
};

function sanitizeConfig(rawConfig = {}) {
  const debounceIntervalMs = Number(rawConfig.debounceIntervalMs);
  const maxBatchSize = Number(rawConfig.maxBatchSize);
  const targetCollection = rawConfig.targetCollection;

  return {
    debounceIntervalMs:
      Number.isInteger(debounceIntervalMs) && debounceIntervalMs > 0
        ? debounceIntervalMs
        : defaultConfig.debounceIntervalMs,
    maxBatchSize:
      Number.isInteger(maxBatchSize) && maxBatchSize > 0
        ? maxBatchSize
        : defaultConfig.maxBatchSize,
    targetCollection:
      typeof targetCollection === "string" && targetCollection.trim()
        ? targetCollection.trim()
        : defaultConfig.targetCollection
  };
}

function loadConfigFromDisk() {
  try {
    const fileData = fs.readFileSync(configPath, "utf-8");
    return sanitizeConfig(JSON.parse(fileData));
  } catch (error) {
    console.warn(
      "[DebounceService] Failed to load app config. Falling back to defaults:",
      error.message
    );
    return { ...defaultConfig };
  }
}

let appConfig = loadConfigFromDisk();

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
      appConfig = loadConfigFromDisk();
      console.log("Configuration reloaded automatically:", appConfig);
    } catch (e) {
      console.error("Failed to reload config", e);
    }
  }

  getConfig() {
    return appConfig;
  }

  addEvent(event) {
    this.eventBuffer.push({
      eventId: event._id._data,
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

  getRecentBatches() {
    return [...this.processedBatches];
  }
}

const debounceService = new DebounceService();

module.exports = debounceService;
