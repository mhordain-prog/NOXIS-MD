module.exports = {
  name: "choose",
  aliases: ["choice"],
  description: "Choisir aléatoirement une option",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const options = args.join(' ').split('|').map(x => x.trim()).filter(Boolean); if (options.length < 2) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .choose option1 | option2 | option3' }); const chosen = options[Math.floor(Math.random() * options.length)]; return sock.sendMessage(jid, { text: '🎯 Choix : ' + chosen });
  }
};