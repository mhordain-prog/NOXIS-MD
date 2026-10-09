const config = require("../../config");
const { askAI, getUserErrorMessage } = require("../../lib/aiClient");

module.exports = {
  name: "ai",
  aliases: ["gpt", "ia"],
  category: "ai",
  description: "Pose une question à l'assistant IA NOXIS-MD",
  async execute(sock, msg, args, ctx) {
    const question = (ctx?.args || args || []).join(" ").trim();
    const to = ctx?.sender || msg.key.remoteJid;

    if (!question) {
      return sock.sendMessage(to, {
        text: "🧠 *NOXIS-MD • IA*\n\nPose-moi une question.\nExemple : " + (config.prefix || ".") + "ai explique la photosynthèse"
      }, { quoted: msg });
    }

    try {
      const answer = await askAI(question);
      const chunks = answer.match(/[\s\S]{1,3500}/g) || ["Aucune réponse."];
      for (let i = 0; i < chunks.length; i++) {
        await sock.sendMessage(to, {
          text: (i === 0 ? "🧠 *NOXIS-MD • IA*\n\n" : "") + chunks[i]
        }, { quoted: i === 0 ? msg : undefined });
      }
    } catch (error) {
      console.error("NOXIS AI command error:", error.code || error.message);
      return sock.sendMessage(to, { text: getUserErrorMessage(error) }, { quoted: msg });
    }
  }
};
