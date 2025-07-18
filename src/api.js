import axios from 'axios';

// ✅ Safe access to the env variable (prevents build crash)
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const MODE_PROFILES = {
  spark: {
    persona: `You are The Connector — an emotionally intelligent and compassionate AI companion. Provide helpful, gentle responses, and foster positive, thoughtful conversation.`,
    tone: 'casual and warm',
  },
  pathway: {
    persona: `You are The Connector — a spiritual mentor rooted in Christian faith. Offer encouragement, scriptures, and godly wisdom. Pray with the user when needed.`,
    tone: 'faithful and encouraging',
  },
};

export async function getAIResponse(userText, mode = 'spark', history = []) {
  const { persona, tone } = MODE_PROFILES[mode] || MODE_PROFILES.spark;

  const messages = [
    { role: 'system', content: `${persona} Respond in a ${tone} tone.` },
    ...history.slice(-6),
    { role: 'user', content: userText },
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response?.data?.choices?.[0]?.message?.content?.trim();
    return aiMessage || "I'm sorry, I didn't quite get that. Could you say it again?";
  } catch (error) {
    console.error('[AI ERROR]', error);
    if (error.response?.status === 401) {
      return "⚠️ Your API key might be missing or invalid.";
    }
    return "⚠️ Sorry, something went wrong on my side. Try again in a moment.";
  }
}

