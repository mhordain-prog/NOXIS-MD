module.exports = {
  name: 'choose',
  aliases: ['choisir', 'choice'],
  category: 'fun',
  description: 'Choisir une option au hasard',

  async execute(sock, msg, args) {
    const raw = args.join(' ');
    const options = raw.split('|').map(x => x.trim()).filter(Boolean);
    if (options.length < 2) {
      return sock.sendMessage(msg.key.remoteJid, { text: '🎯 Utilisation : .choose option 1 | option 2 | option 3' });
    }
    const pick = options[Math.floor(Math.random() * options.length)];
    return sock.sendMessage(msg.key.remoteJid, { text: '🎯 Choix : ' + pick });
  }
};
