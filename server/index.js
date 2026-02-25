const express = require("express");
const cors = require("cors");
require("dotenv").config();

const reportRoutes = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:8080" }));
app.use(express.json());

// Routes
app.use("/api/report", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
