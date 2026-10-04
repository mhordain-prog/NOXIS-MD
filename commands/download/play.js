const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const youtubeDl = require('youtube-dl-exec');

async function searchYouTube(query) {
  const result = await yts(query);
  return (result.videos || []).slice(0, 5).map((video) => ({
    title: video.title || 'Sans titre',
    url: video.url,
    duration: video.timestamp || video.duration?.timestamp || 'Inconnue',
    author: video.author?.name || 'YouTube'
  }));
}

async function downloadYouTubeAudio(url) {
  const output = path.join(os.tmpdir(), 'noxis-audio-' + Date.now() + '.%(ext)s');

  await youtubeDl(url, {
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: '5',
    output,
    noPlaylist: true,
    noWarnings: true,
    quiet: true
  });

  const files = fs.readdirSync(os.tmpdir())
    .filter((file) => file.startsWith(path.basename(output).split('.%(ext)s')[0]))
    .map((file) => path.join(os.tmpdir(), file));

  if (!files.length) throw new Error('Fichier audio introuvable après téléchargement.');
  return files[0];
}

module.exports = {
  name: 'play',
  aliases: ['song'],
  description: 'Rechercher sur YouTube et télécharger un son autorisé',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return sock.sendMessage(jid, {
        text: '⚠️ Utilisation : .play <titre>\nExemple : .play Fally Ipupa'
      });
    }

    try {
      const url = /^https?:\/\//i.test(input)
        ? input
        : (await searchYouTube(input))[0]?.url;

      if (!url) {
        return sock.sendMessage(jid, {
          text: '🔎 Aucun résultat YouTube trouvé pour : ' + input
        });
      }

      const audioPath = await downloadYouTubeAudio(url);
      const audio = fs.readFileSync(audioPath);

      await sock.sendMessage(jid, {
        audio,
        mimetype: 'audio/mpeg',
        fileName: path.basename(audioPath).replace(/\\.[^.]+$/, '.mp3'),
        ptt: false
      });

      try { fs.unlinkSync(audioPath); } catch {}
    } catch (error) {
      console.error('YouTube audio error:', error);
      return sock.sendMessage(jid, {
        text: '❌ Impossible de télécharger ce son. Utilise cette commande uniquement pour des contenus que tu as le droit de télécharger.\\n\\n' +
          'Détail : ' + (error.message || 'erreur inconnue')
      });
    }
  }
};
