module.exports = {
  name: "groupinfo",
  aliases: ["ginfo", "infogroup"],
  description: "Afficher les informations du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, {
        text: "❌ Cette commande fonctionne uniquement dans un groupe."
      });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const admins = (metadata.participants || []).filter(p => p.admin).length;
      const members = (metadata.participants || []).length;

      const text =
        "📋 *INFOS DU GROUPE*\n\n" +
        "🏷️ Nom : " + (metadata.subject || "Inconnu") + "\n" +
        "👥 Membres : " + members + "\n" +
        "👑 Administrateurs : " + admins + "\n" +
        "🆔 ID : " + jid;

      await sock.sendMessage(jid, { text });
    } catch (error) {
      console.error("Groupinfo error:", error.message);
      await sock.sendMessage(jid, {
        text: "❌ Impossible de récupérer les informations du groupe."
      });
    }
  }
};
