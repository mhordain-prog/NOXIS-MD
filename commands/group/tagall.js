module.exports = {
  name: "tagall",
  aliases: ["mentionall", "everyone"],
  description: "Mentionner tous les membres du groupe",

  async execute(sock, msg, args) {
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

    const mentions = metadata.participants.map(p => p.id);
    const message = args.length ? args.join(" ") : "📢 Mention de tous les membres";

    await sock.sendMessage(jid, {
      text: message,
      mentions
    });
  }
};