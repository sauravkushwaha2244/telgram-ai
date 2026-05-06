// telegram.js - CORRECTED
async function sendTelegramMessage(data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials missing - skipping notification");
    return;
  }

  const message = `
📢 New Assignment Submitted

👤 Student: ${data.studentName}
🎓 Roll No: ${data.rollNo}
📘 Subject: ${data.subject}
📄 File: ${data.fileName}
🤖 AI Quality: ${data.aiScore}%
⚠️ Plagiarism Risk: ${data.plagiarismScore}%
✍️ Grammar: ${data.grammarScore}%
🏷️ Status: ${data.status}
`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (!response.ok) {
      console.error("Telegram API error:", response.status);
    }
  } catch (err) {
    console.error("Telegram error:", err.message);
  }
}

module.exports = { sendTelegramMessage };