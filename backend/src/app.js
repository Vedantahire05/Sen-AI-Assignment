const express = require("express");
const cors = require("cors");

const emailRoutes = require("./routes/emailRoutes");
const streamRoutes = require("./routes/streamRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const classifierRoutes = require("./routes/classifierRoutes");
const threadRoutes = require("./routes/threadRoutes");
const agentRoutes = require("./routes/agentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const auditRoutes = require("./routes/auditRoutes");
const toolRoutes = require("./routes/toolRoutes");
const respondRoutes = require("./routes/respondRoutes");
const draftRoutes = require("./routes/draftRoutes");
const ragRoutes = require("./routes/ragRoutes");
const intelligenceRoutes = require("./routes/intelligenceRoutes");
const docsRoutes = require("./routes/docsRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Consistent error envelope middleware ──────────────────────────────────────
app.use((req, res, next) => {
  res.error = (status, code, message, details = {}) => {
    return res.status(status).json({ error_code: code, message, details });
  };
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", emailRoutes);
app.use("/api/stream", streamRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/classifier", classifierRoutes);
app.use("/threads", threadRoutes);
app.use("/agent", agentRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/contacts", contactRoutes);
app.use("/audit", auditRoutes);
app.use("/tools", toolRoutes);
app.use("/respond", respondRoutes);
app.use("/drafts", draftRoutes);
app.use("/rag", ragRoutes);
app.use("/intelligence", intelligenceRoutes);
app.use("/docs", docsRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SenAI CRM API Running",
    version: "2.0.0",
    docs: "/docs",
    endpoints: {
      ingest: "POST /api/ingest",
      jobStatus: "GET /api/status/:jobId",
      stream: "POST /api/stream/start",
      threads: "GET /threads/:contact_email",
      agent: "POST /agent/run/:emailId",
      dryRun: "POST /agent/dry-run/:emailId",
      sentimentTrend: "GET /analytics/sentiment-trend?sender=X&days=30",
      atRisk: "GET /analytics/at-risk",
      agentPerformance: "GET /analytics/agent-performance",
      ragSearch: "GET /rag/search?q=...",
      reputation: "GET /intelligence/reputation",
      enrich: "POST /intelligence/enrich",
      auditLog: "GET /audit/:entity_type/:entity_id",
    },
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error_code: "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
    details: process.env.NODE_ENV === "development" ? { stack: err.stack } : {},
  });
});

module.exports = app;
