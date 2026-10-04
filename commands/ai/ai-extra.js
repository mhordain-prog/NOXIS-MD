const config = require("../../config");
const axios = require("axios");

async function ask(prompt, system) {
  if (!config.openaiKey) return null;
  const r = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system || "Tu es NOXIS-MD, assistant utile et concis. Réponds en français sauf demande contraire." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    },
    { headers: { Authorization: "Bearer " + config.openaiKey }, timeout: 30000 }
  );
  return r.data?.choices?.[0]?.message?.content || null;
}

function command(name, aliases, instruction, usage) {
  return {
    name, aliases, category: "ai", description: instruction,
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ").trim();
      if (!q) return sock.sendMessage(ctx.sender, { text: "🧠 Utilisation : " + config.prefix + usage });
      if (!config.openaiKey) return sock.sendMessage(ctx.sender, { text: "🧠 IA non configurée : ajoute OPENAI_API_KEY sur le serveur." });
      try {
        const answer = await ask(instruction + "\n\nDemande : " + q);
        return sock.sendMessage(ctx.sender, { text: "🧠 " + (answer || "Aucune réponse.") });
      } catch (e) {
        return sock.sendMessage(ctx.sender, { text: "❌ Service IA indisponible." });
      }
    }
  };
}

module.exports = [
  command("explain", ["expliquer", "explication"], "Explique clairement le sujet donné avec des exemples simples.", "explain sujet"),
  command("code", ["coder", "program"], "Aide à écrire ou corriger du code. Donne une solution claire et explique brièvement les changements.", "code demande"),
  command("rewrite", ["reformule", "rephrase"], "Reformule le texte en conservant son sens et en améliorant sa clarté.", "rewrite texte"),
  command("grammar", ["grammaire", "correct"], "Corrige la grammaire et l'orthographe du texte et explique les corrections importantes.", "grammar texte"),
  command("ideas", ["idees", "brainstorm"], "Propose plusieurs idées originales et réalisables sur le sujet.", "ideas sujet"),
  command("quizai", ["quizia"], "Crée un petit quiz adapté au sujet demandé, avec les réponses à la fin.", "quizai sujet")
];