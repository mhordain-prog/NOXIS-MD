const play = require('./play');

module.exports = {
  name: 'video',
  aliases: ['vid'],
  description: 'Rechercher une vidéo ou envoyer une vidéo depuis une URL directe',

  async execute(sock, msg, args) {
    const input = args.join(' ').trim();
    if (!input) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Utilisation : .video titre ou .video https://exemple.com/video.mp4'
      });
    }
    return play.execute(sock, msg, args);
  }
};