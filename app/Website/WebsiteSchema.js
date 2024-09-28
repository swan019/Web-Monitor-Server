const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isActive: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const WebsiteSchema = mongoose.model("website", schema);

module.exports = WebsiteSchema;
