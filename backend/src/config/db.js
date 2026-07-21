const mongoose = require("mongoose");
const env = require("./env");

let dbConnected = false;

async function connectDatabase() {
  mongoose.set("bufferCommands", false);

  mongoose.connection.on("connected", () => {
    dbConnected = true;
    console.log("[db] Connected to MongoDB");
  });

  mongoose.connection.on("disconnected", () => {
    dbConnected = false;
    console.warn("[db] MongoDB disconnected");
  });

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    dbConnected = false;
    console.warn(
      `[db] MongoDB unavailable at startup (${error.message}). Continuing in limited mode.`
    );
  }
}

function isDatabaseConnected() {
  return dbConnected;
}

module.exports = { connectDatabase, isDatabaseConnected };
