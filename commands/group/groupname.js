module.exports = {
  name: "groupname",
  aliases: ["gname"],
  description: "Afficher le nom du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    await sock.sendMessage(jid, { text: "📛 *Nom du groupe*\n\n" + metadata.subject });
  }
};