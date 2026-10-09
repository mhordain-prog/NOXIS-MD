const config = require("../../config");
const { askAI, getUserErrorMessage } = require("../../lib/aiClient");

const send = (sock, to, text, msg) =>
  sock.sendMessage(to, { text }, msg ? { quoted: msg } : undefined);

async function runCommand(sock, msg, args, ctx, instruction, usage, prefixText) {
  const question = args.join(" ").trim();
  const to = ctx?.sender || msg.key.remoteJid;
  if (!question) return send(sock, to, `🧠 Utilisation : ${config.prefix || "."}${usage}`, msg);

  try {
    const answer = await askAI(
      instruction ? instruction + "\n\nDemande : " + question : question
    );
    return send(sock, to, prefixText + answer, msg);
  } catch (error) {
    console.error("NOXIS AI command error:", error.code || error.message);
    return send(sock, to, getUserErrorMessage(error), msg);
  }
}

module.exports = [
  {
    name: "ask",
    aliases: ["question", "chat"],
    category: "ai",
    description: "Pose une question à l'IA",
    async execute(sock, msg, args, ctx) {
      return runCommand(sock, msg, args, ctx, "", "ask ta question", "🧠 ");
    }
  },
  {
    name: "translate",
    aliases: ["traduire", "trad"],
    category: "ai",
    description: "Traduit un texte avec l'IA",
    async execute(sock, msg, args, ctx) {
      return runCommand(sock, msg, args, ctx,
        "Traduis précisément ce texte. Si une langue cible est indiquée, utilise-la.",
        "translate langue cible : texte", "🌍 ");
    }
  },
  {
    name: "summarize",
    aliases: ["resume", "résumé"],
    category: "ai",
    description: "Résume un texte",
    async execute(sock, msg, args, ctx) {
      return runCommand(sock, msg, args, ctx,
        "Résume ce texte en quelques points simples.",
        "summarize ton texte", "📝 ");
    }
  }
];
