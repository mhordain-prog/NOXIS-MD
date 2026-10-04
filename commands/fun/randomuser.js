module.exports = {
  name: "randomuser",
  aliases: ["randuser"],
  description: "Choisir un membre du groupe au hasard",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' });
    const metadata = await sock.groupMetadata(jid);
    if (!metadata.participants.length) return sock.sendMessage(jid, { text: 'ℹ️ Aucun membre trouvé.' });
    const p = metadata.participants[Math.floor(Math.random() * metadata.participants.length)];
    return sock.sendMessage(jid, { text: '🎲 Membre choisi : @' + p.id.split('@')[0], mentions: [p.id] });
  }
};