module.exports = {
  name: "score",
  aliases: ["points"],
  description: "Afficher un score ludique de groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const n = Math.floor(Math.random() * 101);
    return sock.sendMessage(jid, { text: '🏆 Score fun : ' + n + '/100' });
  }
};