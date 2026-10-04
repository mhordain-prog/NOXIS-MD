const axios = require('axios');
const yts = require('yt-search');

async function searchYouTube(query) {
  const result = await yts(query);
  const videos = (result.videos || []).slice(0, 5);

  return videos.map((video) => ({
    title: video.title || 'Sans titre',
    url: video.url,
    duration: video.timestamp || video.duration?.timestamp || 'Inconnue',
    author: video.author?.name || 'YouTube'
  }));
}

module.exports = {
  name: 'play',
  aliases: ['song'],
  description: 'Rechercher un titre ou une vidéo sur YouTube',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return sock.sendMessage(jid, {
        text: '⚠️ Utilisation : .play titre\nExemple : .play Fally Ipupa'
      });
    }

    // Une URL directe reste prise en charge pour les médias directs.
    if (/^https?:\/\//i.test(input)) {
      try {
        const response = await axios.get(input, {
          responseType: 'arraybuffer',
          maxContentLength: 50 * 1024 * 1024,
          maxBodyLength: 50 * 1024 * 1024,
          timeout: 30000
        });

        const type = String(response.headers['content-type'] || 'application/octet-stream')
          .split(';')[0]
          .toLowerCase();
        const buffer = Buffer.from(response.data);

        if (type.startsWith('audio/')) {
          return sock.sendMessage(jid, { audio: buffer, mimetype: type });
        }
        if (type.startsWith('video/')) {
          return sock.sendMessage(jid, { video: buffer, mimetype: type });
        }
        if (type.startsWith('image/')) {
          return sock.sendMessage(jid, { image: buffer, mimetype: type });
        }

        return sock.sendMessage(jid, {
          document: buffer,
          mimetype: type,
          fileName: 'download'
        });
      } catch (error) {
        return sock.sendMessage(jid, {
          text: '❌ Téléchargement impossible : ' + error.message
        });
      }
    }

    try {
      const videos = await searchYouTube(input);

      if (!videos.length) {
        return sock.sendMessage(jid, {
          text: '🔎 Aucun résultat YouTube trouvé pour : ' + input
        });
      }

      const lines = videos.map((video, index) =>
        (index + 1) + '. ' + video.title +
        '\n   👤 ' + video.author +
        '\n   ⏱️ ' + video.duration +
        '\n   🔗 ' + video.url
      );

      return sock.sendMessage(jid, {
        text:
          '🎵 *NOXIS-MD — Recherche YouTube*\n\n' +
          '🔎 ' + input + '\n\n' +
          lines.join('\n\n')
      });
    } catch (error) {
      console.error('YouTube search error:', error);
      return sock.sendMessage(jid, {
        text: '❌ Recherche YouTube impossible : ' + error.message
      });
    }
  }
};