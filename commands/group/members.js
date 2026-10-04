module.exports = {
  name: "members",
  aliases: ["memberlist", "listmembers"],
  description: "Afficher les membres du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });

    const metadata = await sock.groupMetadata(jid);
    const mentions = metadata.participants.map(p => p.id);
    const lines = metadata.participants.map((p, i) => {
      const role = p.admin ? "🛡️ Admin" : "👤 Membre";
      return (i + 1) + ". " + role + " @" + p.id.split("@")[0];
    });

    await sock.sendMessage(jid, {
      text: "👥 *Membres du groupe (" + metadata.participants.length + ")*\n\n" + lines.join("\n"),
      mentions
    });
  }
};