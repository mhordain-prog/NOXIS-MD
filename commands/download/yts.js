module.exports = {
  name: 'yts',
  aliases: ['ytsearch'],
  description: 'Préparer une recherche YouTube sans téléchargement automatique',

  async execute(sock, msg, args) {
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Utilisation : .yts titre' });
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    return sock.sendMessage(msg.key.remoteJid, { text: '🔎 Recherche YouTube :\n' + url });
  }
};