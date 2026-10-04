const config = require("../../config");
const axios = require("axios");

const send = (sock, to, text) => sock.sendMessage(to, { text });

async function ask(prompt) {
  if (!config.openaiKey) return null;
  const r = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es NOXIS-MD, un assistant WhatsApp utile, clair et concis. Réponds en français sauf si l'utilisateur demande une autre langue." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    },
    {
      headers: { Authorization: "Bearer " + config.openaiKey },
      timeout: 30000
    }
  );
  return r.data?.choices?.[0]?.message?.content || null;
}

module.exports = [
  {
    name: "ask",
    aliases: ["question", "chat"],
    category: "ai",
    description: "Pose une question à l'IA",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ");
      if (!q) return send(sock, ctx.sender, `🧠 Usage: ${config.prefix}ask ta question`);
      if (!config.openaiKey) return send(sock, ctx.sender, "🧠 IA non configurée sur le serveur.");
      try {
        const answer = await ask(q);
        return send(sock, ctx.sender, "🧠 " + answer);
      } catch {
        return send(sock, ctx.sender, "❌ Le service IA est momentanément indisponible.");
      }
    }
  },
  {
    name: "translate",
    aliases: ["traduire", "trad"],
    category: "ai",
    description: "Traduit un texte avec l'IA",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ");
      if (!q) return send(sock, ctx.sender, `🌍 Usage: ${config.prefix}translate anglais: bonjour`);
      if (!config.openaiKey) return send(sock, ctx.sender, "🧠 IA non configurée sur le serveur.");
      try {
        return send(sock, ctx.sender, "🌍 " + await ask("Traduis précisément ce texte. Si une langue cible est indiquée, utilise-la. Texte: " + q));
      } catch {
        return send(sock, ctx.sender, "❌ Traduction indisponible.");
      }
    }
  },
  {
    name: "summarize",
    aliases: ["resume", "résumé"],
    category: "ai",
    description: "Résume un texte",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ");
      if (!q) return send(sock, ctx.sender, `📝 Usage: ${config.prefix}summarize ton texte`);
      if (!config.openaiKey) return send(sock, ctx.sender, "🧠 IA non configurée sur le serveur.");
      try {
        return send(sock, ctx.sender, "📝 " + await ask("Résume ce texte en quelques points simples: " + q));
      } catch {
        return send(sock, ctx.sender, "❌ Résumé indisponible.");
      }
    }
  }
];
