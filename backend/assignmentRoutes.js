const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const upload = require("./config/upload");
const Assignment = require("./Assignmet");
const { analyzeWithAI } = require("./Analysis");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const { sendTelegramMessage } = require("./telegram");

const router = express.Router();

const analysisCache = new Map();

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function getStatus(qualityScore, plagiarismRisk) {
  if (plagiarismRisk <= 30) return "Safe";
  if (plagiarismRisk <= 60) return "Needs Review";
  return "High Risk";
}

function useDatabase() {
  return mongoose.connection.readyState === 1;
}

async function extractTextFromBuffer(buffer, mimeType) {
  try {
    if (mimeType === "text/plain") {
      return buffer.toString("utf-8").slice(0, 15000);
    }

    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      await parser.load();
      const text = await parser.getText();
      await parser.destroy();
      return text.slice(0, 15000);
    }

    if (
      mimeType === "application/msword" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 15000);
    }

    return `Unsupported file type: ${mimeType}`;
  } catch (error) {
    return `Could not extract file content: ${error.message}`;
  }
}

router.post("/upload", upload.single("assignment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { studentName, rollNo, subject } = req.body;

    if (!studentName || !rollNo || !subject) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const fileHash = hashBuffer(req.file.buffer);
    console.log(`\n📄 Processing: ${req.file.originalname}`);
    console.log(`🔐 File Hash: ${fileHash}`);

    if (analysisCache.has(fileHash)) {
      console.log("✓ Cache hit - returning cached analysis");
      const cached = analysisCache.get(fileHash);

      const payload = {
        studentName,
        rollNo,
        subject,
        fileName: req.file.originalname,
        fileHash,
        aiScore: cached.qualityScore,
        plagiarismScore: cached.plagiarismRisk,
        grammarScore: cached.grammarScore,
        status: cached.status,
        reasoning: cached.reasoning
      };

      const assignment = useDatabase()
        ? await Assignment.create(payload)
        : payload;

      return res.json({
        message: "Assignment analyzed (cached)",
        assignment
      });
    }

    console.log("⏳ Running AI analysis...");

    let fileContent = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    
    if (fileContent.includes("[")) {
      fileContent = `${fileContent}\n\nFile: ${req.file.originalname}\nSize: ${req.file.size} bytes\nType: ${req.file.mimetype}`;
    }

    const analysis = await analyzeWithAI(
      fileContent,
      studentName,
      rollNo,
      subject
    );

    const status = getStatus(analysis.qualityScore, analysis.plagiarismRisk);

    const cacheData = {
      qualityScore: analysis.qualityScore,
      plagiarismRisk: analysis.plagiarismRisk,
      grammarScore: analysis.grammarScore,
      reasoning: analysis.reasoning,
      status
    };

    analysisCache.set(fileHash, cacheData);
    console.log("✓ Analysis cached");

    const payload = {
      studentName,
      rollNo,
      subject,
      fileName: req.file.originalname,
      fileHash,
      aiScore: analysis.qualityScore,
      plagiarismScore: analysis.plagiarismRisk,
      grammarScore: analysis.grammarScore,
      status,
      reasoning: analysis.reasoning
    };

    const assignment = useDatabase()
      ? await Assignment.create(payload)
      : payload;

    await sendTelegramMessage(assignment);

    console.log(`✓ Analysis complete - Status: ${status}`);

    res.json({
      message: "Assignment analyzed successfully",
      assignment
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    let assignments;

    if (useDatabase()) {
      assignments = await Assignment.find()
        .sort({ submittedAt: -1 })
        .limit(100);
    } else {
      assignments = [];
    }

    res.json(assignments);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Safe", "Needs Review", "High Risk"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!useDatabase()) {
      return res.status(400).json({ message: "Database not connected" });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!useDatabase()) {
      return res.status(400).json({ message: "Database not connected" });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;