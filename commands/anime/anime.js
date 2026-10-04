const axios = require('axios');

module.exports = {
  name: 'anime',
  aliases: ['animes', 'animsearch', 'manga', 'animepic'],
  category: 'anime',
  description: 'Rechercher un manga/anime et envoyer son illustration',
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const q = args.join(' ').trim();

    if (!q) {
      return sock.sendMessage(jid, {
        text: '🎭 *NOXIS-MD • ANIME*\n\nUtilise : *.anime <nom du manga/anime>*\nExemple : *.anime Naruto*'
      });
    }

    try {
      const { data } = await axios.get('https://api.jikan.moe/v4/anime', {
        params: { q, limit: 1, sfw: true },
        timeout: 12000
      });

      const a = data?.data?.[0];
      if (!a) {
        return sock.sendMessage(jid, {
          text: '❌ Aucun anime/manga trouvé pour : *' + q + '*'
        });
      }

      const title = a.title || q;
      const image = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;

      const caption =
        '🎭 *NOXIS-MD • ANIME*\n\n' +
        '📚 *' + title + '*\n' +
        '⭐ Score : ' + (a.score ?? 'N/A') + '\n' +
        '🎬 Type : ' + (a.type || 'N/A') + '\n' +
        '📺 Épisodes : ' + (a.episodes ?? 'N/A') + '\n' +
        '📅 Statut : ' + (a.status || 'N/A');

      if (!image) return sock.sendMessage(jid, { text: caption });

      const img = await axios.get(image, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      return sock.sendMessage(jid, {
        image: Buffer.from(img.data),
        caption
      });
    } catch (e) {
      console.error('anime error:', e.message);
      return sock.sendMessage(jid, {
        text: '❌ Le service anime est temporairement indisponible. Réessaie dans quelques secondes.'
      });
    }
  }
};