const { getDB } = require("../config/database");
const debounceService = require("./debounceService");

function setupCDC() {
  const db = getDB();
  const config = debounceService.getConfig();
  
  const targetCollectionName = config.targetCollection || "users";
  
  try {
    const collection = db.collection(targetCollectionName);

    // Create Change Stream
    // Note: This requires MongoDB to be running as a Replica Set
    console.log(`[CDC Service] Setting up Change Stream on collection: >${targetCollectionName}<`);

    const changeStream = collection.watch([], { fullDocument: "updateLookup" });

    changeStream.on("change", (changeEvent) => {
      console.log(`[CDC Event] Received '${changeEvent.operationType}' event from MongoDB.`);
      // Send event to Debounce Service for batching
      debounceService.addEvent(changeEvent);
    });

    changeStream.on("error", (error) => {
      console.error("[CDC Error] Change Stream error:", error);
      if (error.code === 40573 || error.message.includes("replica set")) {
        console.warn(`
          ==================================================
          WARNING: MongoDB is not running as a Replica Set!
                   Change Streams require a replica set.
                   Please run mongod with --replSet rs0 
                   and execute rs.initiate() in mongosh.
          ==================================================
        `);
      }
    });

    changeStream.on("close", () => {
      console.warn("[CDC Service] Change Stream closed.");
    });

    console.log(
      `[CDC Service] Change Stream initialized for '${targetCollectionName}'.`
    );
    return changeStream;
  } catch (err) {
    console.error("Failed to setup CDC Change Stream:", err.message);
    return null;
  }
}

async function closeCDC(changeStream) {
  if (changeStream) {
    await changeStream.close();
    console.log("[CDC Service] Change Stream closed cleanly.");
  }
}

module.exports = { setupCDC, closeCDC };
