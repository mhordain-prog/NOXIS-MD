const activity = require("../../lib/activityTracker");

module.exports = {
  name: "groupstats",
  aliases: ["statsgroup", "gstats"],
  category: "group",
  description: "Afficher un résumé complet des statistiques du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const stats = activity.getGroup(jid);
    const participants = metadata.participants || [];
    const admins = participants.filter(p => p.admin).length;
    const active = participants.filter(p => (stats[p.id]?.messages || 0) > 0).length;
    const totalMessages = participants.reduce((n, p) => n + (stats[p.id]?.messages || 0), 0);

    const sorted = participants.map(p => ({
      id: p.id,
      messages: stats[p.id]?.messages || 0
    })).sort((a, b) => b.messages - a.messages);

    const top = sorted.slice(0, 3);
    const mentions = top.map(x => x.id);

    return sock.sendMessage(jid, {
      text:
        "📊 *STATISTIQUES DU GROUPE*\n\n" +
        "🏷️ Nom : " + (metadata.subject || "Groupe") + "\n" +
        "👥 Membres : " + participants.length + "\n" +
        "🛡️ Administrateurs : " + admins + "\n" +
        "🟢 Membres actifs : " + active + "\n" +
        "💬 Messages comptés : " + totalMessages + "\n\n" +
        "🔥 *TOP 3 ACTIVITÉ*\n" +
        (top.length ? top.map((x, i) => (i + 1) + ". @" + x.id.split("@")[0] + " — " + x.messages + " message(s)").join("\n") : "Aucune donnée.") +
        "\n\nℹ️ Les statistiques commencent à compter les messages reçus par le bot.",
      mentions
    });
  }
};
