const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true
    },
    rollNo: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileHash: {
      type: String,
      unique: true,
      sparse: true
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100
    },
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100
    },
    grammarScore: {
      type: Number,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ["Safe", "Needs Review", "High Risk"],
      default: "Safe"
    },
    reasoning: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);