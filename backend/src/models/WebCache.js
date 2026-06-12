const mongoose = require("mongoose");

const WebCacheSchema = new mongoose.Schema({
  source_url: { type: String, required: true, unique: true, index: true },
  target_entity: { type: String, default: "" },
  scraped_data: { type: mongoose.Schema.Types.Mixed, default: {} },
  scraped_at: { type: Date, default: Date.now },
  expires_at: { type: Date, index: true },
});

module.exports = mongoose.model("WebCache", WebCacheSchema);
