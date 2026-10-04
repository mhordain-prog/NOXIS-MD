const axios = require('axios');

module.exports = {
  name: 'play',
  aliases: ['song', 'download', 'dl'],
  description: 'Télécharger un média depuis une URL directe',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const url = args[0];
    if (!url || !/^https?:\/\//i.test(url)) {
      return sock.sendMessage(jid, { text: '⚠️ Utilisation : .play https://exemple.com/media.mp3' });
    }
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', maxContentLength: 50 * 1024 * 1024, maxBodyLength: 50 * 1024 * 1024, timeout: 30000 });
      const type = String(response.headers['content-type'] || 'application/octet-stream').split(';')[0].toLowerCase();
      const buffer = Buffer.from(response.data);
      if (type.startsWith('audio/')) return sock.sendMessage(jid, { audio: buffer, mimetype: type });
      if (type.startsWith('video/')) return sock.sendMessage(jid, { video: buffer, mimetype: type });
      if (type.startsWith('image/')) return sock.sendMessage(jid, { image: buffer, mimetype: type });
      return sock.sendMessage(jid, { document: buffer, mimetype: type, fileName: 'download' });
    } catch (error) {
      return sock.sendMessage(jid, { text: '❌ Téléchargement impossible : ' + error.message });
    }
  }
};