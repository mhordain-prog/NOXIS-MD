const axios = require('axios');

module.exports = {
  name: 'tts',
  aliases: ['say', 'speak'],
  description: 'Convertir un court texte en audio',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const text = args.join(' ').trim();
    if (!text) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .tts bonjour tout le monde' });
    if (text.length > 180) return sock.sendMessage(jid, { text: '⚠️ Texte trop long. Limite : 180 caractères.' });

    try {
      const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fr&q=' + encodeURIComponent(text);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const buffer = Buffer.from(response.data);
      return sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false });
    } catch (error) {
      return sock.sendMessage(jid, { text: '❌ TTS indisponible : ' + error.message });
    }
  }
};