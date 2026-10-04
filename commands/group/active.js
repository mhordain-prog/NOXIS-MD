const activity = require('../../lib/activityTracker');

module.exports = {
  name: "active",
  aliases: ["activity", "activityrank", "activite"],
  description: "Afficher le classement d’activité du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const stats = activity.getGroup(jid);
    const rows = metadata.participants.map(p => {
      const s = stats[p.id] || { messages: 0, lastSeen: 0 };
      return { id: p.id, messages: s.messages, lastSeen: s.lastSeen };
    }).sort((a, b) => b.messages - a.messages);

    const active = rows.filter(r => r.messages > 0);
    const inactive = rows.filter(r => r.messages === 0);
    const top = active.slice(0, 10);
    const mentions = top.map(r => r.id);

    const lines = top.length
      ? top.map((r, i) => (i + 1) + '. @' + r.id.split('@')[0] + ' — ' + r.messages + ' message(s)').join('\n')
      : 'Aucune activité enregistrée pour le moment.';

    const least = active.slice(-5).reverse();
    const leastLines = least.length
      ? least.map((r, i) => (i + 1) + '. @' + r.id.split('@')[0] + ' — ' + r.messages + ' message(s)').join('\n')
      : 'Aucune donnée.';

    const text = '📊 *CLASSEMENT D’ACTIVITÉ*\n\n' +
      '👥 Membres : ' + rows.length + '\n' +
      '🟢 Actifs : ' + active.length + '\n' +
      '⚪ Sans activité enregistrée : ' + inactive.length + '\n\n' +
      '🔥 *Plus actifs*\n' + lines + '\n\n' +
      '📉 *Moins actifs parmi les membres ayant parlé*\n' + leastLines + '\n\n' +
      'ℹ️ Le classement compte les messages reçus depuis l’installation du suivi.';

    await sock.sendMessage(jid, { text, mentions });
  }
};