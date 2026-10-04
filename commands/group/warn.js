const warnings = require("../../lib/warnings");

module.exports = {
  name: "warn",
  aliases: ["avertir"],
  description: "Avertir un membre du groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const target = context?.participant;
    if (!target) {
      return sock.sendMessage(jid, { text: "❌ Réponds au message du membre à avertir." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);
    const targetMember = metadata.participants.find(p => p.id === target);

    if (!senderMember || !["admin", "superadmin"].includes(senderMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur pour utiliser cette commande." });
    }

    if (targetMember && ["admin", "superadmin"].includes(targetMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Les administrateurs ne peuvent pas être avertis par cette commande." });
    }

    const reason = args.join(" ").trim() || "Aucune raison précisée.";
    const count = await warnings.add(jid, target, reason);

    await sock.sendMessage(jid, {
      text: `⚠️ AVERTISSEMENT ${count}/3\n\n👤 Membre : @${target.split("@")[0]}\n📝 Motif : ${reason}`,
      mentions: [target]
    });
  }
};