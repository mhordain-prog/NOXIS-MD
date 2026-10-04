module.exports = {
  name: "promote",
  aliases: ["admin"],
  description: "Promouvoir un membre comme administrateur",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const sender = msg.key.participant || msg.key.remoteJid;
    const metadata = await sock.groupMetadata(jid);
    const senderMember = metadata.participants.find(p => p.id === sender);
    if (!senderMember?.admin) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur." });
    }

    const botNumber = sock.user.id.split(":")[0];
    const botMember = metadata.participants.find(p => p.id.startsWith(botNumber));
    if (!botMember?.admin) {
      return sock.sendMessage(jid, { text: "❌ Je dois être administrateur." });
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0];
    if (!target) {
      return sock.sendMessage(jid, { text: "⚠️ Mentionne le membre.\nExemple : .promote @membre" });
    }

    await sock.groupParticipantsUpdate(jid, [target], "promote");
    await sock.sendMessage(jid, { text: "✅ Membre promu administrateur." });
  }
};