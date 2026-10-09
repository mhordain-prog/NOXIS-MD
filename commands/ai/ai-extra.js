const config = require("../../config");
const { askAI, getUserErrorMessage } = require("../../lib/aiClient");

function command(name, aliases, instruction, usage) {
  return {
    name,
    aliases,
    category: "ai",
    description: instruction,
    async execute(sock, msg, args, ctx) {
      const question = args.join(" ").trim();
      const to = ctx?.sender || msg.key.remoteJid;
      if (!question) {
        return sock.sendMessage(to, {
          text: "🧠 Utilisation : " + (config.prefix || ".") + usage
        }, { quoted: msg });
      }

      try {
        const answer = await askAI(instruction + "\n\nDemande : " + question);
        const chunks = answer.match(/[\s\S]{1,3500}/g) || ["Aucune réponse."];
        for (let i = 0; i < chunks.length; i++) {
          await sock.sendMessage(to, {
            text: (i === 0 ? "🧠 " : "") + chunks[i]
          }, { quoted: i === 0 ? msg : undefined });
        }
      } catch (error) {
        console.error("NOXIS AI command error:", error.code || error.message);
        return sock.sendMessage(to, { text: getUserErrorMessage(error) }, { quoted: msg });
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
