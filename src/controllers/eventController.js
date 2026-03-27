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
    res.json({
      success: true,
      data: debounceService.getRecentBatches()
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
  simulateEvent
};
