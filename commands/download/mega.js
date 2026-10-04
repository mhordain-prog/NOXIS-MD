const axios = require('axios');

module.exports = {
  name: 'mega',
  aliases: ['megadl'],
  description: 'Vérifier un lien MEGA et fournir son adresse',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const url = args[0];
    if (!url || !/^https?:\/\/(www\.)?mega\.nz\//i.test(url)) {
      return sock.sendMessage(jid, { text: '⚠️ Utilisation : .mega https://mega.nz/file/...' });
    }

    try {
      const response = await axios.head(url, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true
      });
      if (response.status >= 400) {
        return sock.sendMessage(jid, { text: '❌ Le lien MEGA semble inaccessible (HTTP ' + response.status + ').' });
      }
      return sock.sendMessage(jid, { text: '🔗 Lien MEGA valide et accessible :\n' + url + '\n\nℹ️ Le téléchargement direct MEGA n’est pas activé dans NOXIS-MD.' });
    } catch (error) {
      return sock.sendMessage(jid, { text: '❌ Impossible de vérifier le lien MEGA : ' + error.message });
    }
  }
};