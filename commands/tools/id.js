module.exports = {
  name: "id",
  aliases: ["myid", "jid"],
  category: "tools",
  description: "Afficher l’identifiant WhatsApp du chat ou du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid) return;
    return sock.sendMessage(jid, {
      text: "🆔 *IDENTIFIANT*\n\n" + jid
    });
  }
};
