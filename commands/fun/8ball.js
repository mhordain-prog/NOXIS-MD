module.exports = {
  name: "8ball",
  aliases: ["eightball"],
  description: "Répondre à une question avec une réponse aléatoire",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const answers = ['🎱 Oui.', '🎱 Non.', '🎱 Peut-être.', '🎱 Très probable.', '🎱 Peu probable.', '🎱 Le hasard décidera.']; const q = args.join(' ').trim(); if (!q) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .8ball Ta question' }); return sock.sendMessage(jid, { text: '🎱 ' + answers[Math.floor(Math.random() * answers.length)] });
  }
};