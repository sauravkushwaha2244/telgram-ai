const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAMES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite"
];

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing");
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

function getModel(modelName) {
  return getClient().getGenerativeModel({ model: modelName });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(modelName, prompt) {
  const aiModel = getModel(modelName);
  const response = await aiModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  });
  return response.response.text() || "";
}

async function analyzeWithAI(fileContent, studentName, rollNo, subject) {
  const prompt = `You are an academic assignment evaluator. Analyze this student assignment carefully and provide accurate scores.

Student Name: ${studentName}
Roll No: ${rollNo}
Subject: ${subject}

Assignment Content:
${fileContent.slice(0, 6000)}

Evaluate the assignment and respond with ONLY a valid JSON object:
{
  "qualityScore": <number 0-100, how good is the content quality, research depth, and relevance>,
  "plagiarismRisk": <number 0-100, likelihood of plagiarism based on writing style patterns>,
  "grammarScore": <number 0-100, grammar and language quality>,
  "reasoning": "<2-3 sentence analysis explaining your scores>"
}

Important: Provide realistic, varied scores based on actual content analysis. Do NOT default all scores to 50.`;

  let lastError = null;

  for (const modelName of MODEL_NAMES) {
    try {
      console.log(`📤 Trying model: ${modelName}...`);

      const rawText = await callGemini(modelName, prompt);
      console.log(`📥 AI Response (${modelName}):`, rawText);

      let cleanText = rawText.trim();
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      let result;

      try {
        result = JSON.parse(cleanText);
      } catch (parseError) {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("❌ Failed to parse extracted JSON:", e.message);
            result = null;
          }
        } else {
          console.error("❌ No JSON found in AI response:", cleanText);
          result = null;
        }
      }

      if (!result || typeof result !== "object") {
        throw new Error("AI returned invalid analysis — could not parse response");
      }

      const qualityScore = Number(result.qualityScore);
      const plagiarismRisk = Number(result.plagiarismRisk);
      const grammarScore = Number(result.grammarScore);

      const finalResult = {
        qualityScore: isNaN(qualityScore) ? 50 : Math.max(0, Math.min(100, qualityScore)),
        plagiarismRisk: isNaN(plagiarismRisk) ? 50 : Math.max(0, Math.min(100, plagiarismRisk)),
        grammarScore: isNaN(grammarScore) ? 50 : Math.max(0, Math.min(100, grammarScore)),
        reasoning: result.reasoning || "Analysis complete"
      };

      console.log(`✅ Analysis complete (${modelName}):`, {
        quality: finalResult.qualityScore,
        plagiarism: finalResult.plagiarismRisk,
        grammar: finalResult.grammarScore
      });

      return finalResult;

    } catch (error) {
      lastError = error;
      const is429 = error.message && error.message.includes("429");

      if (is429) {
        console.warn(`⚠️ ${modelName} quota exceeded, trying next model...`);
        continue;
      }

      console.error(`❌ AI Error (${modelName}):`, error.message);
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }

  console.error("❌ All Gemini models quota exceeded");
  throw new Error("AI Analysis failed: All model quotas exceeded. Please wait a few minutes and try again.");
}

module.exports = { analyzeWithAI };