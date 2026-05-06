const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

async function analyzeWithAI(fileContent, studentName, rollNo, subject) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY missing");
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

    const response = await client.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const text = response.choices[0].message.content || "";
    console.log("AI Response:", text);

    let result;
    const trimmedText = text.trim();

    try {
      // Try parsing the entire response first
      result = JSON.parse(trimmedText);
    } catch (parseError) {
      // Extract JSON objects using a more robust method
      const jsonObjects = [];
      let braceCount = 0;
      let startIdx = -1;

      for (let i = 0; i < trimmedText.length; i++) {
        if (trimmedText[i] === '{') {
          if (braceCount === 0) startIdx = i;
          braceCount++;
        } else if (trimmedText[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            jsonObjects.push(trimmedText.substring(startIdx, i + 1));
            startIdx = -1;
          }
        }
      }

      // Try to parse extracted JSON objects
      let parsed = false;
      for (const jsonStr of jsonObjects) {
        try {
          result = JSON.parse(jsonStr);
          parsed = true;
          break;
        } catch (e) {
          // Continue to next JSON object
        }
      }

      if (!parsed) {
        console.error("Failed to parse AI response:", trimmedText);
        // Return default values if parsing fails
        result = {
          qualityScore: 50,
          plagiarismRisk: 50,
          grammarScore: 50,
          reasoning: "Analysis could not be parsed"
        };
      }
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