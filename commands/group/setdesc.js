module.exports = {
  name: "setdesc",
  aliases: ["groupdesc", "setdescription"],
  description: "Modifier la description du groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const desc = args.join(" ").trim();
    if (!desc) {
      return sock.sendMessage(jid, { text: "⚠️ Utilisation : .setdesc Nouvelle description" });
    }
    if (desc.length > 512) {
      return sock.sendMessage(jid, { text: "❌ La description est trop longue." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);
    if (!senderMember?.admin) return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur." });

    const botNumber = sock.user.id.split(":")[0];
    const botMember = metadata.participants.find(p => p.id.startsWith(botNumber));
    if (!botMember?.admin) return sock.sendMessage(jid, { text: "❌ Je dois être administrateur." });

    await sock.groupUpdateDescription(jid, desc);
    await sock.sendMessage(jid, { text: "✅ Description du groupe modifiée." });
  }
};