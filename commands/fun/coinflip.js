module.exports = {
  name: 'coinflip',
  aliases: ['pileface', 'flip'],
  category: 'fun',
  description: 'Lancer une pièce',

  async execute(sock, msg) {
    const result = Math.random() < 0.5 ? '🪙 PILE' : '🪙 FACE';
    return sock.sendMessage(msg.key.remoteJid, { text: result });
  }
};
