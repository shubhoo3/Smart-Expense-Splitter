const express = require("express");
const cors = require("cors");
const path = require("path");

const initDB = require("./db/init");
const groupRoutes = require("./routes/groups");
const memberRoutes = require("./routes/members");
const expenseRoutes = require("./routes/expenses");
const statsRoutes = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
initDB();

// Routes
app.use("/api/groups", groupRoutes);
app.use("/api", memberRoutes);
app.use("/api", expenseRoutes);
app.use("/api/groups", statsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
