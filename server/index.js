const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const { initSocket } = require("./socket");
const reportRoutes = require("./routes/report");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Parse allowed origins from CLIENT_URL (comma-separated)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:8080")
  .split(",")
  .map((o) => o.trim());

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/report", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
