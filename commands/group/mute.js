module.exports = {
  name: "mute",
  aliases: ["closechat"],
  description: "Fermer le groupe aux messages des membres",

  async execute(sock, msg, args) {
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

    await sock.groupSettingUpdate(jid, "announcement");
    await sock.sendMessage(jid, { text: "🔒 Groupe fermé : seuls les administrateurs peuvent envoyer des messages." });
  }
};