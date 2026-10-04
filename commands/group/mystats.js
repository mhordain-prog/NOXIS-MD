const activity = require('../../lib/activityTracker');

module.exports = {
  name: "mystats",
  aliases: ["myactivity", "myrank"],
  description: "Afficher ses statistiques d’activité dans le groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const stats = activity.getGroup(jid);
    const rows = metadata.participants.map(p => ({
      id: p.id,
      messages: (stats[p.id] || { messages: 0 }).messages
    })).sort((a, b) => b.messages - a.messages);

    const index = rows.findIndex(r => r.id === sender);
    const me = rows[index];
    const rank = index >= 0 ? index + 1 : rows.length;
    const total = rows.reduce((sum, r) => sum + r.messages, 0);

    await sock.sendMessage(jid, {
      text: '📊 *MES STATISTIQUES*\n\n' +
        '👤 @' + sender.split('@')[0] + '\n' +
        '💬 Messages comptés : ' + (me?.messages || 0) + '\n' +
        '🏆 Classement : #' + rank + ' / ' + rows.length + '\n' +
        '📈 Messages du groupe : ' + total,
      mentions: [sender]
    });
  }
};