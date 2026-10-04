const warnings = require('../../lib/warnings');

module.exports = {
  name: 'warnings',
  aliases: ['warns', 'avertissements'],
  category: 'security',
  description: 'Afficher les avertissements d’un membre',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' });

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const target = context?.participant || msg.key.participant || jid;
    const list = warnings.get(jid, target);
    const lines = list.length ? list.map((w, i) => (i + 1) + '. ' + w.reason).join('\n') : 'Aucun avertissement.';

    return sock.sendMessage(jid, {
      text: '⚠️ AVERTISSEMENTS : @' + target.split('@')[0] + '\n\n' + lines + '\n\n📊 Total : ' + list.length,
      mentions: [target]
    });
  }
};
