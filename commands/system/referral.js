const referral = require("../../lib/referralStore");

const SITE_URL = "https://noxis-md-wa.onrender.com";

module.exports = {
  name: "parrainage",
  aliases: ["ref", "referral", "invite", "inviter", "topref"],
  category: "system",
  description: "Code, lien, statistiques et classement du parrainage NOXIS-MD.",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const userId = msg.key.participant || jid;
    const action = String(args?.[0] || "").trim().toLowerCase();

    if (action === "top" || action === "classement" || action === "leaderboard" || action === "rank") {
      const board = referral.getLeaderboard(10);
      const lines = board.length
        ? board.map((item, index) => (index + 1) + ". " + item.code + " — " + item.count + " filleul" + (item.count > 1 ? "s" : "")).join("\n")
        : "Aucun parrainage enregistré pour le moment.";

      return sock.sendMessage(jid, {
        text:
          "🏆 *CLASSEMENT PARRAINAGE NOXIS-MD*\n\n" +
          lines +
          "\n\n👥 Total des filleuls : *" + referral.getTotalReferrals() + "*"
      });
    }

    if (action) {
      const result = referral.applyReferral(userId, args[0]);
      const messages = {
        invalid: "❌ Code de parrainage invalide.",
        self: "❌ Tu ne peux pas utiliser ton propre code de parrainage.",
        already: "ℹ️ Ton parrainage est déjà enregistré. Il ne peut pas être remplacé."
      };

      if (!result.ok) {
        return sock.sendMessage(jid, {
          text: messages[result.reason] || "❌ Impossible d'enregistrer ce parrainage."
        });
      }

      return sock.sendMessage(jid, {
        text:
          "✅ *PARRAINAGE ENREGISTRÉ !*\n\n" +
          "👤 Parrain : *" + result.referrer.code + "*\n" +
          "🎁 Ton compte est maintenant rattaché à ce parrain."
      });
    }

    const stats = referral.getStats(userId);
    const link = SITE_URL + "/?ref=" + encodeURIComponent(stats.code);

    return sock.sendMessage(jid, {
      text:
        "🤝 *PARRAINAGE NOXIS-MD*\n\n" +
        "🏷️ Ton code : *" + stats.code + "*\n" +
        "👥 Filleuls : *" + stats.count + "*\n" +
        (stats.referredBy ? "👤 Parrain : *" + stats.referredBy + "*\n" : "") +
        "\n🔗 Lien de partage :\n" + link + "\n\n" +
        "📌 Utiliser un code : *.parrainage CODE*\n" +
        "🏆 Classement : *.parrainage top*"
    });
  }
};
