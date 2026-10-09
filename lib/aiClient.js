const axios = require("axios");
const config = require("../config");

const DEFAULT_SYSTEM_PROMPT =
  "Tu es NOXIS-MD, un assistant IA utile, prudent et clair. Réponds en français sauf si l'utilisateur demande une autre langue. Si tu ne connais pas une réponse, dis-le. Pour le code, propose des solutions compatibles avec le contexte fourni.";

async function askAI(prompt, systemPrompt = DEFAULT_SYSTEM_PROMPT) {
  const apiKey = String(config.openaiKey || "").trim();
  if (!apiKey) {
    const error = new Error("IA_NOT_CONFIGURED");
    error.code = "IA_NOT_CONFIGURED";
    throw error;
  }

  const question = String(prompt || "").trim();
  if (!question) {
    const error = new Error("EMPTY_PROMPT");
    error.code = "EMPTY_PROMPT";
    throw error;
  }
  if (question.length > 12000) {
    const error = new Error("PROMPT_TOO_LONG");
    error.code = "PROMPT_TOO_LONG";
    throw error;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: config.openaiModel || "gpt-4o-mini",
        messages: [
          { role: "system", content: String(systemPrompt || DEFAULT_SYSTEM_PROMPT) },
          { role: "user", content: question }
        ],
        temperature: 0.4,
        max_tokens: 900
      },
      {
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        timeout: 45000
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      const error = new Error("EMPTY_AI_RESPONSE");
      error.code = "EMPTY_AI_RESPONSE";
      throw error;
    }
    return answer.trim();
  } catch (error) {
    if (error.code && String(error.code).startsWith("IA_")) throw error;
    if (error.code === "PROMPT_TOO_LONG" || error.code === "EMPTY_PROMPT") throw error;

    const status = error.response?.status;
    const mapped = new Error(
      status === 401 || status === 403 ? "IA_AUTH_ERROR" :
      status === 429 ? "IA_RATE_LIMIT" :
      status >= 500 ? "IA_PROVIDER_ERROR" :
      error.code === "ECONNABORTED" ? "IA_TIMEOUT" :
      "IA_REQUEST_FAILED"
    );
    mapped.code = mapped.message;
    throw mapped;
  }
}

function getUserErrorMessage(error) {
  switch (error?.code) {
    case "IA_NOT_CONFIGURED":
      return "🧠 IA non configurée. Ajoute la variable OPENAI_API_KEY dans les variables d’environnement Render, puis redémarre le service.";
    case "IA_AUTH_ERROR":
      return "🔑 La clé OpenAI est refusée. Vérifie OPENAI_API_KEY dans Render.";
    case "IA_RATE_LIMIT":
      return "⏳ Limite ou crédit API atteint. Vérifie la facturation et les limites de ton compte OpenAI.";
    case "IA_TIMEOUT":
      return "⏳ L’IA met trop de temps à répondre. Réessaie dans quelques instants.";
    case "IA_PROVIDER_ERROR":
      return "⚠️ Le service IA rencontre un problème temporaire. Réessaie plus tard.";
    case "PROMPT_TOO_LONG":
      return "✂️ Ta demande est trop longue. Envoie un texte plus court (12 000 caractères maximum).";
    case "EMPTY_PROMPT":
      return "✍️ Écris une question après la commande.";
    default:
      return "❌ Impossible d’obtenir une réponse de l’IA. Vérifie la connexion et les journaux du serveur.";
  }
}

module.exports = { askAI, getUserErrorMessage, DEFAULT_SYSTEM_PROMPT };
