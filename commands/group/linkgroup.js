module.exports = {
  name: "linkgroup",
  aliases: ["grouplink", "link"],
  description: "Obtenir le lien d’invitation du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);
    if (!senderMember?.admin) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur." });
    }

    const botNumber = sock.user.id.split(":")[0];
    const botMember = metadata.participants.find(p => p.id.startsWith(botNumber));
    if (!botMember?.admin) {
      return sock.sendMessage(jid, { text: "❌ Je dois être administrateur." });
    }

    const code = await sock.groupInviteCode(jid);
    await sock.sendMessage(jid, { text: "🔗 *Lien d’invitation du groupe*\n\nhttps://chat.whatsapp.com/" + code });
  }
};