const config = require('../../config');
const commandLoader = require('../../lib/commandLoader');
const os = require('os');

module.exports = {
  name: 'botinfo',
  aliases: ['about', 'bot'],
  category: 'system',
  description: 'Afficher les informations du bot',

  async execute(sock, msg) {
    const commands = commandLoader.getCommands();
    const memory = process.memoryUsage();

    await sock.sendMessage(msg.key.remoteJid, {
      text:
        '🤖 NOXIS-MD\n\n' +
        '🏷️ Version : ' + (config.version || '2.0.0') + '\n' +
        '📦 Commandes : ' + commands.length + '\n' +
        '🟢 Node.js : ' + process.version + '\n' +
        '💻 Plateforme : ' + os.platform() + '\n' +
        '🧠 RAM : ' + Math.round(memory.rss / 1024 / 1024) + ' MB\n' +
        '⚡ Uptime : ' + Math.floor(process.uptime()) + ' s'
    });
  }
};
