// Vercel Serverless Function — бэкенд для Миры
// Ключ API хранится в переменной окружения POLZA_API_KEY
// Получить на: https://polza.ai/dashboard → API Keys

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.POLZA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { system, messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  // Polza.ai использует OpenAI-совместимый формат
  const chatMessages = [
    { role: "system", content: system || "" },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch("https://api.polza.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: max_tokens || 1000,
        temperature: 0.85,
        messages: chatMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Polza API error:", data);
      return res.status(response.status).json({ error: data.message || data.error || "API error" });
    }

    const text = data.choices?.[0]?.message?.content || null;
    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
