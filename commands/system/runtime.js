module.exports = {
  name: 'runtime',
  aliases: ['uptime', 'up'],
  category: 'system',
  description: 'Afficher depuis combien de temps le bot fonctionne',

  async execute(sock, msg) {
    const total = Math.floor(process.uptime());
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    await sock.sendMessage(msg.key.remoteJid, {
      text:
        '⏱️ NOXIS-MD RUNTIME\n\n' +
        '🟢 Statut : en ligne\n' +
        '📅 Fonctionnement : ' + days + 'j ' + hours + 'h ' + minutes + 'm ' + seconds + 's'
    });
  }
};
