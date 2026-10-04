const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const youtubeDl = require('youtube-dl-exec');

async function searchYouTube(query) {
  const result = await yts(query);
  const video = (result.videos || [])[0];

  if (!video) return null;

  return {
    title: video.title || 'Sans titre',
    url: video.url,
    duration: video.timestamp || video.duration?.timestamp || 'Inconnue',
    author: video.author?.name || 'YouTube',
    thumbnail: video.thumbnail || null,
    views: video.views || 0
  };
}

async function downloadYouTubeAudio(url) {
  const base = 'noxis-audio-' + Date.now();
  const output = path.join(os.tmpdir(), base + '.%(ext)s');

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
    .filter((file) => file.startsWith(base + '.'))
    .map((file) => path.join(os.tmpdir(), file));

  if (!files.length) {
    throw new Error('Fichier audio introuvable après téléchargement.');
  }

  return files[0];
}

async function getThumbnailBuffer(url) {
  if (!url) return null;

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 10000,
    maxContentLength: 5 * 1024 * 1024
  });

  return Buffer.from(response.data);
}

module.exports = {
  name: 'play',
  aliases: ['song'],
  category: 'download',
  description: 'Rechercher un son sur YouTube et envoyer sa pochette avec l’audio',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return sock.sendMessage(jid, {
        text: '⚠️ Utilisation : .play <titre>\nExemple : .play Chocolat Caméléon'
      });
    }

    let audioPath = null;

    try {
      const info = /^https?:\/\//i.test(input)
        ? {
            title: input,
            url: input,
            duration: 'Inconnue',
            author: 'YouTube',
            thumbnail: null,
            views: 0
          }
        : await searchYouTube(input);

      if (!info) {
        return sock.sendMessage(jid, {
          text: '🔎 Aucun résultat YouTube trouvé pour : ' + input
        });
      }

      // Envoie d’abord la fiche du morceau avec sa pochette.
      let thumbnail = null;
      try {
        thumbnail = await getThumbnailBuffer(info.thumbnail);
      } catch (thumbnailError) {
        console.warn('Thumbnail error:', thumbnailError.message);
      }

      const caption = [
        '🎵 NOXIS-MD • PLAY',
        '',
        '🎶 Titre : ' + info.title,
        '👤 Artiste/Chaîne : ' + info.author,
        '⏱️ Durée : ' + info.duration,
        info.views ? '👁️ Vues : ' + info.views.toLocaleString('fr-FR') : null,
        '',
        '🔎 Recherche YouTube : ' + input
      ].filter(Boolean).join('\n');

      if (thumbnail) {
        await sock.sendMessage(jid, {
          image: thumbnail,
          caption
        });
      } else {
        await sock.sendMessage(jid, { text: caption });
      }

      // Le téléchargement reste limité aux contenus que l’utilisateur a le droit de récupérer.
      audioPath = await downloadYouTubeAudio(info.url);
      const audio = fs.readFileSync(audioPath);

      await sock.sendMessage(jid, {
        audio,
        mimetype: 'audio/mpeg',
        fileName: path.basename(audioPath).replace(/\.[^.]+$/, '.mp3'),
        ptt: false
      });

      try { fs.unlinkSync(audioPath); } catch {}
    } catch (error) {
      console.error('YouTube audio error:', error);

      if (audioPath) {
        try { fs.unlinkSync(audioPath); } catch {}
      }

      const detail = error?.stderr || error?.message || 'erreur inconnue';

      return sock.sendMessage(jid, {
        text:
          '❌ La recherche YouTube fonctionne, mais le téléchargement audio a échoué.\n\n' +
          'Détail : ' + detail.slice(0, 1200) + '\n\n' +
          '⚠️ Si YouTube demande une vérification anti-bot, le bot ne contourne pas cette protection. Il faut utiliser une source ou une méthode d’accès autorisée.'
      });
    }
  }
};
