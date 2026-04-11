const { MongoClient } = require("mongodb");

let client;
let db;

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/cdc_demo";
  const dbName = process.env.MONGODB_DB_NAME || "cdc_demo";

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

function getClient() {
  return client;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectDB, getDB, getClient, closeDB };
