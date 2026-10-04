const axios = require('axios');

const EXAMPLES = [
  'Naruto','One Piece','Dragon Ball','Bleach','Demon Slayer','Jujutsu Kaisen',
  'One Punch Man','My Hero Academia','Attack on Titan','Hunter x Hunter',
  'Fairy Tail','Black Clover','Death Note','Tokyo Ghoul','Chainsaw Man',
  'Spy x Family','Fullmetal Alchemist','Sword Art Online','Haikyuu','Sailor Moon',
  'Solo Leveling','Blue Lock','Vinland Saga','Mob Psycho 100','Dr. Stone',
  'Fire Force','Black Butler',"JoJo's Bizarre Adventure",'Tokyo Revengers',
  'Assassination Classroom','Magi','Inuyasha','Code Geass','Steins;Gate',
  'Re:Zero','Overlord','Konosuba','Classroom of the Elite','Frieren',
  'Oshi no Ko','Mashle','Kaiju No. 8','Wind Breaker','The Seven Deadly Sins',
  'Berserk','Gintama','Yu Yu Hakusho','Rurouni Kenshin','Fate/Zero',
  'Neon Genesis Evangelion','Cowboy Bebop','Noragami','Soul Eater',
  'The Promised Neverland','Parasyte','Erased','Akame ga Kill!','Hellsing',
  'The Apothecary Diaries','Delicious in Dungeon'
];

module.exports = {
  name: 'anime',
  aliases: ['animes', 'animsearch', 'manga', 'animepic'],
  category: 'anime',
  description: 'Rechercher un anime et envoyer son illustration',
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const q = args.join(' ').trim();

    if (!q) {
      return sock.sendMessage(jid, {
        text: '🎭 *NOXIS-MD • ANIME*\n\nUtilise : *.anime <nom>*\nExemple : *.anime Naruto*\n\n📚 Exemples :\n' +
          EXAMPLES.map((x, i) => (i + 1) + '. ' + x).join('\n') +
          '\n\n💡 La recherche peut aussi trouver d’autres titres.'
      });
    }

    try {
      const { data } = await axios.get('https://api.jikan.moe/v4/anime', {
        params: { q, limit: 1, sfw: true },
        timeout: 12000
      });

      const a = data?.data?.[0];
      if (!a) return sock.sendMessage(jid, {
        text: '❌ Aucun anime trouvé pour : *' + q + '*'
      });

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