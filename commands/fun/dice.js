module.exports = {
  name: "dice",
  aliases: ["de"],
  description: "Lancer un dé",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const n = Math.floor(Math.random() * 6) + 1; return sock.sendMessage(jid, { text: '🎲 Résultat : ' + n });
  }
};