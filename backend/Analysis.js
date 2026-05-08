const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

async function analyzeWithAI(fileContent, studentName, rollNo, subject) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const prompt = `Analyze this student assignment and respond with ONLY a valid JSON object, nothing else.

Student Name: ${studentName}
Roll No: ${rollNo}
Subject: ${subject}

Assignment Content:
${fileContent.slice(0, 6000)}

RESPOND WITH ONLY THIS JSON FORMAT (no other text):
{
  "qualityScore": 0-100,
  "plagiarismRisk": 0-100,
  "grammarScore": 0-100,
  "reasoning": "brief analysis"
}`;

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024
      }
    });

    const text = response.response.text() || "";
    console.log("AI Response:", text);

    let result;

    try {
      result = JSON.parse(text.trim());
    } catch (error) {
      result = {
        qualityScore: 50,
        plagiarismRisk: 50,
        grammarScore: 50,
        reasoning: "Analysis could not be parsed"
      };
    }

    return {
      qualityScore: Math.max(0, Math.min(100, Number(result.qualityScore) || 50)),
      plagiarismRisk: Math.max(0, Math.min(100, Number(result.plagiarismRisk) || 50)),
      grammarScore: Math.max(0, Math.min(100, Number(result.grammarScore) || 50)),
      reasoning: result.reasoning || "Analysis complete"
    };

  } catch (error) {
    console.error("AI Error:", error.message);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeWithAI };