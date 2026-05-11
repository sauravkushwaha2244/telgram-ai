const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv")
const path = require("path");
const dns = require("dns");

dotenv.config();

// Force Google DNS for SRV record resolution (fixes restricted network issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Catch unhandled errors so the process doesn't crash silently
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const assignmentRoutes = require("./assignmentRoutes");

const app = express();
let serverStarted = false;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/assignments", assignmentRoutes);

app.get("/", (req, res) => {
  res.send("AI Submission System Backend is running");
});

function startServer(message) {
  if (serverStarted) {
    return;
  }

  serverStarted = true;

  if (message) {
    console.log(message);
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Kill the other process or use a different port.`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✓ MongoDB connected");
      startServer();
    })
    .catch((err) => {
      startServer(`MongoDB connection error: ${err.message}. Running in demo mode.`);
    });
} else {
  startServer("MONGO_URI not set. Running in demo mode.");
}

module.exports = app;