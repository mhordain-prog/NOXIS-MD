module.exports = {
  name: "setname",
  aliases: ["groupname", "setsubject"],
  description: "Modifier le nom du groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const name = args.join(" ").trim();
    if (!name) {
      return sock.sendMessage(jid, { text: "⚠️ Utilisation : .setname Nouveau nom" });
    }
    if (name.length > 100) {
      return sock.sendMessage(jid, { text: "❌ Le nom est trop long." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);
    if (!senderMember?.admin) return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur." });

    const botNumber = sock.user.id.split(":")[0];
    const botMember = metadata.participants.find(p => p.id.startsWith(botNumber));
    if (!botMember?.admin) return sock.sendMessage(jid, { text: "❌ Je dois être administrateur." });

    await sock.groupUpdateSubject(jid, name);
    await sock.sendMessage(jid, { text: "✅ Nom du groupe modifié en : " + name });
  }
};