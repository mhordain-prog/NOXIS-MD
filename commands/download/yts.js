const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'yts',
  aliases: ['ytsearch'],
  description: 'Rechercher des vidéos YouTube',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .yts titre' });

    if (!config.youtubeKey) {
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
      return sock.sendMessage(jid, { text: '🔎 Recherche YouTube :\n' + url + '\n\nℹ️ Ajoute YOUTUBE_API_KEY pour recevoir les 5 premiers résultats directement.' });
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          type: 'video',
          maxResults: 5,
          q: query,
          key: config.youtubeKey
        },
        timeout: 15000
      });

      const items = response.data.items || [];
      if (!items.length) return sock.sendMessage(jid, { text: '❌ Aucun résultat trouvé.' });

      const lines = items.map((item, i) => {
        const title = item.snippet?.title || 'Sans titre';
        const id = item.id?.videoId;
        return (i + 1) + '. ' + title + (id ? '\n   https://youtu.be/' + id : '');
      });

      return sock.sendMessage(jid, { text: '🔎 Résultats YouTube pour : ' + query + '\n\n' + lines.join('\n\n') });
    } catch (error) {
      return sock.sendMessage(jid, { text: '❌ Recherche YouTube impossible : ' + (error.response?.data?.error?.message || error.message) });
    }
  }
};