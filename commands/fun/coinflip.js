module.exports = {
  name: "coinflip",
  aliases: ["coin"],
  description: "Lancer une pièce",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const r = Math.random() < 0.5 ? '🪙 Face' : '🪙 Pile'; return sock.sendMessage(jid, { text: r });
  }
};