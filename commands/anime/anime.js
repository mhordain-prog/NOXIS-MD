const axios = require('axios');

module.exports = {
  name: 'anime',
  aliases: ['animes', 'animsearch'],
  category: 'anime',
  description: 'Rechercher un anime',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(jid, { text: '🎭 Utilisation : .anime <nom>\nExemple : .anime Naruto' });

    try {
      const { data } = await axios.get('https://api.jikan.moe/v4/anime', {
        params: { q, limit: 1, sfw: true },
        timeout: 12000
      });
      const a = data?.data?.[0];
      if (!a) return sock.sendMessage(jid, { text: '❌ Aucun anime trouvé pour : ' + q });

      const text =
        '🎭 NOXIS-MD • ANIME\n\n' +
        '📺 ' + (a.title || 'Inconnu') + '\n' +
        '⭐ Score : ' + (a.score ?? 'N/A') + '\n' +
        '📚 Épisodes : ' + (a.episodes ?? 'N/A') + '\n' +
        '📅 Statut : ' + (a.status || 'N/A') + '\n' +
        '🎬 Type : ' + (a.type || 'N/A') + '\n' +
        '🔗 ' + (a.url || '');

      const image = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;
      if (image) {
        try {
          const img = await axios.get(image, { responseType: 'arraybuffer', timeout: 10000 });
          return sock.sendMessage(jid, { image: Buffer.from(img.data), caption: text });
        } catch {}
      }
      return sock.sendMessage(jid, { text });
    } catch (e) {
      console.error('anime error:', e.message);
      return sock.sendMessage(jid, { text: '❌ Le service anime est temporairement indisponible.' });
    }
  }
};
