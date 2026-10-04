module.exports = {
  name: "groupid",
  aliases: ["gid", "idgroup"],
  description: "Afficher l’identifiant du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    await sock.sendMessage(jid, {
      text: "🆔 *ID du groupe*\n\n" + jid
    });
  }
};