module.exports = {
  name: "admins",
  aliases: ["adminlist", "listadmins"],
  description: "Afficher la liste des administrateurs",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const admins = metadata.participants.filter(p => p.admin);
    if (!admins.length) return sock.sendMessage(jid, { text: "ℹ️ Aucun administrateur trouvé." });

    const mentions = admins.map(p => p.id);
    const lines = admins.map((p, i) => {
      const role = p.admin === "superadmin" ? "👑 Créateur" : "🛡️ Admin";
      return (i + 1) + ". " + role + " @" + p.id.split("@")[0];
    });

    await sock.sendMessage(jid, {
      text: "🛡️ *Administrateurs du groupe*\n\n" + lines.join("\n"),
      mentions
    });
  }
};