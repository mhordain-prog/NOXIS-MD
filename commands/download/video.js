const play = require('./play');

module.exports = {
  name: 'video',
  aliases: ['vid'],
  description: 'Télécharger une vidéo depuis une URL directe',

  async execute(sock, msg, args) {
    const url = args[0];
    if (!url || !/^https?:\/\//i.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Utilisation : .video https://exemple.com/video.mp4' });
    }
    return play.execute(sock, msg, args);
  }
};