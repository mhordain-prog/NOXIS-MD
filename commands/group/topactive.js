const activity = require('../../lib/activityTracker');

module.exports = {
  name: "topactive",
  aliases: ["top", "mostactive"],
  description: "Afficher les membres les plus actifs",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' });
    const metadata = await sock.groupMetadata(jid);
    const stats = activity.getGroup(jid);
    const rows = metadata.participants.map(p => ({ id: p.id, messages: stats[p.id]?.messages || 0 }))
      .sort((a, b) => b.messages - a.messages).slice(0, 10);
    const mentions = rows.map(r => r.id);
    const lines = rows.map((r, i) => (i + 1) + '. @' + r.id.split('@')[0] + ' — ' + r.messages + ' message(s)');
    await sock.sendMessage(jid, { text: '🔥 *TOP 10 DES PLUS ACTIFS*\n\n' + (lines.join('\n') || 'Aucune donnée.'), mentions });
  }
};