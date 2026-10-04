const warnings = require("../../lib/warnings");

module.exports = {
  name: "resetwarn",
  aliases: ["clearwarn", "resetwarnings"],
  description: "Réinitialiser les avertissements d'un membre",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const target = context?.participant;
    if (!target) return sock.sendMessage(jid, { text: "❌ Réponds au message du membre concerné." });

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);

    if (!senderMember || !["admin", "superadmin"].includes(senderMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur pour utiliser cette commande." });
    }

    await warnings.reset(jid, target);
    await sock.sendMessage(jid, {
      text: `✅ Avertissements réinitialisés pour @${target.split("@")[0]}.`,
      mentions: [target]
    });
  }
};