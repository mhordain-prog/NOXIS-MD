const axios = require('axios');

module.exports = {
  name: 'mediafire',
  aliases: ['mf'],
  description: 'Récupérer le lien de téléchargement direct d’un fichier MediaFire',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const url = args[0];
    if (!url || !/^https?:\/\/(www\.)?mediafire\.com\//i.test(url)) {
      return sock.sendMessage(jid, { text: '⚠️ Utilisation : .mediafire https://www.mediafire.com/file/...' });
    }

    try {
      const response = await axios.get(url, {
        timeout: 20000,
        maxContentLength: 5 * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = String(response.data);
      const match = html.match(/href=["']([^"']+)["'][^>]*class=["'][^"']*inputurl["']/i)
        || html.match(/href=["'](https?:\/\/download[^"']+)["']/i);

      if (!match?.[1]) {
        return sock.sendMessage(jid, { text: '❌ Lien direct MediaFire introuvable sur cette page.' });
      }

      return sock.sendMessage(jid, { text: '📥 Lien MediaFire :\n' + match[1] });
    } catch (error) {
      return sock.sendMessage(jid, { text: '❌ Impossible de lire MediaFire : ' + error.message });
    }
  }
};