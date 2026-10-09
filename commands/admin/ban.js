const moderation = require("../../lib/moderationStore");
const permissionMiddleware = require("../../lib/permissionMiddleware");

module.exports = {
  name: "ban",
  aliases: ["signalement", "localban"],
  category: "admin",
  description: "Enregistre un signalement et gère les blocages locaux",
  async execute(sock, msg, args, ctx = {}) {
    const senderNumber = ctx.senderNumber || msg.key?.participant || msg.key?.remoteJid || "";
    const allowed = msg.key?.fromMe || permissionMiddleware.isOwnerOrSudo(senderNumber);
    const jid = msg.key?.remoteJid;

    if (!allowed) {
      return sock.sendMessage(jid, { text: "⛔ Commande réservée au propriétaire/SUDO." }, { quoted: msg });
    }

    const action = String(args[0] || "help").toLowerCase();
    const numberInput = args[1] || "";
    const number = moderation.normalizeNumber(numberInput);
    const reason = args.slice(2).join(" ").trim();

    if (action === "help") {
      return sock.sendMessage(jid, {
        text: [
          "╭━━〔 NOXIS-MD • MODÉRATION 〕━━╮",
          "┃ .ban report NUMÉRO MOTIF",
          "┃ .ban block NUMÉRO MOTIF",
          "┃ .ban list",
          "┃ .ban unblock NUMÉRO",
          "╰━━━━━━━━━━━━━━━━━━━━━━╯",
          "",
          "Le signalement est enregistré localement. Aucun signalement automatique n'est envoyé à WhatsApp."
        ].join("\n")
      }, { quoted: msg });
    }

    if (action === "list") {
      const blocked = moderation.listBlocked();
      const text = blocked.length
        ? blocked.map((item, index) => `${index + 1}. ${item.number || item} — ${item.reason || "motif non précisé"}`).join("\n")
        : "Aucun numéro bloqué localement.";
      return sock.sendMessage(jid, { text: "📋 *BLOCAGES LOCAUX*\n\n" + text }, { quoted: msg });
    }

    if (!["report", "block", "unblock"].includes(action)) {
      return sock.sendMessage(jid, { text: "Action inconnue. Tape .ban pour voir l'aide." }, { quoted: msg });
    }

    if (!/^\d{8,15}$/.test(number)) {
      return sock.sendMessage(jid, { text: "❌ Numéro invalide. Utilise l'indicatif international, sans + ni espaces." }, { quoted: msg });
    }

    if (action === "unblock") {
      moderation.unblock(number);
      return sock.sendMessage(jid, { text: `✅ ${number} retiré de la liste de blocage local.` }, { quoted: msg });
    }

    if (!reason) {
      return sock.sendMessage(jid, { text: `Indique un motif.\nExemple : .ban ${action} ${number} spam` }, { quoted: msg });
    }

    const evidence = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ? "Message cité fourni dans la conversation"
      : "";

    const result = moderation.addReport(number, reason, senderNumber, evidence);

    if (action === "block") moderation.block(number, reason, senderNumber);

    const response = action === "block"
      ? `🔒 *BLOCAGE LOCAL ENREGISTRÉ*\n\n📱 Numéro : ${number}\n📝 Motif : ${reason}\n📁 Dossier de signalements : ${result.count}\n\nLe filtre NOXIS-MD empêchera ce numéro de poursuivre le traitement du bot dans les groupes.`
      : `✅ *SIGNALEMENT DOCUMENTÉ*\n\n📱 Numéro : ${number}\n📝 Motif : ${reason}\n🕒 Date : ${result.report.date}\n📁 Dossier : ${result.count}\n\nAucun signalement automatique n'a été envoyé à WhatsApp.`;

    return sock.sendMessage(jid, { text: response }, { quoted: msg });
  }
};
