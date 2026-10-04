module.exports = {
  name: 'dice',
  aliases: ['de', 'roll'],
  category: 'fun',
  description: 'Lancer un dé',

  async execute(sock, msg) {
    const n = Math.floor(Math.random() * 6) + 1;
    return sock.sendMessage(msg.key.remoteJid, { text: '🎲 Résultat : ' + n });
  }
};
