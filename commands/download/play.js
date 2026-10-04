const axios = require('axios');
const config = require('../../config');

async function searchYouTube(query) {
  if (!config.youtubeKey) return null;
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: { part: 'snippet', type: 'video', maxResults: 1, q: query, key: config.youtubeKey },
    timeout: 15000
  });
  const item = response.data.items?.[0];
  if (!item?.id?.videoId) return null;
  return {
    title: item.snippet?.title || query,
    url: 'https://youtu.be/' + item.id.videoId
  };
}

module.exports = {
  name: 'play',
  aliases: ['song', 'download', 'dl'],
  description: 'Télécharger un média depuis une URL directe ou rechercher un titre YouTube',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .play titre ou .play https://exemple.com/audio.mp3' });

    if (!/^https?:\/\//i.test(input)) {
      try {
        const result = await searchYouTube(input);
        if (!result) {
          return sock.sendMessage(jid, { text: '🔎 Aucun résultat YouTube trouvé ou YOUTUBE_API_KEY non configurée. Utilise une URL média directe.' });
        }
        return sock.sendMessage(jid, { text: '🎵 Résultat pour : ' + input + '\n' + result.title + '\n' + result.url + '\n\nℹ️ Le téléchargement automatique depuis YouTube n’est pas activé.' });
      } catch (error) {
        return sock.sendMessage(jid, { text: '❌ Recherche YouTube impossible : ' + (error.response?.data?.error?.message || error.message) });
      }
    }

    try {
      const response = await axios.get(input, {
        responseType: 'arraybuffer',
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
        timeout: 30000
      });
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