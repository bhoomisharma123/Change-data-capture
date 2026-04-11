const debounceService = require("../services/debounceService");

// Get the current status of the CDC buffering system
const getStatus = (req, res) => {
  try {
    const status = debounceService.getStatus();
    res.json({
      success: true,
      message: "CDC System Status",
      data: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retrieve the most recently processed batches
const getRecentBatches = (req, res) => {
  try {
    const status = debounceService.getStatus();
    // Expose the last 10 batches
    res.json({
      success: true,
      data: debounceService.processedBatches
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reload the debouncing configuration from app-config.json
const reloadConfig = (req, res) => {
  try {
    debounceService.reloadConfig();
    const status = debounceService.getStatus();
    res.json({
      success: true,
      message: "Configuration reloaded successfully.",
      config: status.config
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Endpoint to manually simulate a CDC event (for testing without MongoDB if needed)
const simulateEvent = (req, res) => {
  try {
    const { operationType, targetCollection, documentId, data } = req.body;
    
    if (!operationType || !targetCollection || !documentId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: operationType, targetCollection, documentId" 
      });
    }

    const mockEvent = {
        _id: { _data: `mock-${Date.now()}` },
        operationType: operationType,
        ns: { db: "cdc_demo", coll: targetCollection },
        documentKey: { _id: documentId },
        fullDocument: data || null
    };

    debounceService.addEvent(mockEvent);

    res.json({
      success: true,
      message: "Mock CDC event added to debounce buffer.",
      event: mockEvent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getStatus,
  getRecentBatches,
  simulateEvent,
  reloadConfig
};
