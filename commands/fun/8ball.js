module.exports = {
  name: '8ball',
  aliases: ['question', 'oracle'],
  category: 'fun',
  description: 'Répondre aléatoirement à une question',

  async execute(sock, msg, args) {
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(msg.key.remoteJid, { text: '🔮 Pose une question.\nExemple : .8ball Est-ce que ça va marcher ?' });
    const answers = ['🟢 Oui.', '🟢 Très probable.', '🟡 Peut-être.', '🟡 Difficile à dire.', '🔴 Probablement pas.', '🔴 Non.', '🟣 Demande-moi plus tard.'];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return sock.sendMessage(msg.key.remoteJid, { text: '🔮 8 BALL\n\n❓ ' + q + '\n💬 ' + answer });
  }
};
