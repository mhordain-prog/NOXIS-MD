const referral = require("../../lib/referralStore");

const SITE_URL = "https://noxis-md-wa.onrender.com";
const MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
  name: "parrainage",
  aliases: ["ref", "referral", "invite", "inviter", "topref"],
  category: "system",
  description: "Code, lien, points, récompenses et classement du parrainage NOXIS-MD.",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const userId = msg.key.participant || jid;
    const action = String(args?.[0] || "").trim().toLowerCase();

    if (["top", "classement", "leaderboard", "rank"].includes(action)) {
      const board = referral.getLeaderboard(10);
      const lines = board.length
        ? board.map((item, index) => {
            const rank = MEDALS[index] || ("#" + (index + 1));
            const shortId = item.id ? ("+" + item.id.slice(-4)) : item.code;
            return rank + " *" + shortId + "* — " + item.count + " filleul" + (item.count > 1 ? "s" : "") + " · " + item.points + " pts";
          }).join("\n")
        : "Aucun parrainage enregistré pour le moment.";

      return sock.sendMessage(jid, {
        text:
          "🏆 *CLASSEMENT PARRAINAGE NOXIS-MD*\n" +
          "━━━━━━━━━━━━━━━━━━\n" +
          "👑 Top 10 des parrains\n\n" +
          lines +
          "\n\n👥 Total des filleuls : *" + referral.getTotalReferrals() + "*"
      });
    }

    if (["recompenses", "récompenses", "rewards", "points", "bonus"].includes(action)) {
      const stats = referral.getStats(userId);
      const rewards = referral.getRewards();
      const milestoneLines = rewards.milestones.map(item =>
        (stats.count >= item.count ? "✅" : "🔒") +
        " " + item.count + " filleul" + (item.count > 1 ? "s" : "") +
        " → +" + item.bonus + " pts (" + item.label + ")"
      ).join("\n");

      return sock.sendMessage(jid, {
        text:
          "🎁 *RÉCOMPENSES PARRAINAGE*\n\n" +
          "⭐ Tes points : *" + stats.points + "*\n" +
          "👥 Tes filleuls : *" + stats.count + "*\n" +
          "➕ Par filleul : *" + rewards.pointsPerReferral + " pts*\n" +
          "🎉 Bonus d'inscription : *" + rewards.welcomePoints + " pts*\n\n" +
          "🏅 *Paliers*\n" + milestoneLines
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

      const bonusLines = result.newlyEarned?.length
        ? "\n🏅 Nouveau(x) palier(s) :\n" + result.newlyEarned.map(item => "• " + item.label + " : +" + item.bonus + " pts").join("\n")
        : "";

      return sock.sendMessage(jid, {
        text:
          "✅ *PARRAINAGE ENREGISTRÉ !*\n\n" +
          "👤 Parrain : *" + result.referrer.code + "*\n" +
          "⭐ Parrain : *+" + result.referralPoints + " pts*\n" +
          "🎉 Filleul : *+" + result.welcomePoints + " pts*\n" +
          "🏅 Points du parrain : *" + result.referrer.points + "*" +
          bonusLines
      });
    }

    const stats = referral.getStats(userId);
    const link = SITE_URL + "/?ref=" + encodeURIComponent(stats.code);
    const nextText = stats.nextMilestone
      ? "\n🎯 Prochain palier : *" + stats.nextMilestone.count + " filleuls* (+" + stats.nextMilestone.bonus + " pts)"
      : "\n🏆 Tous les paliers sont débloqués !";

    return sock.sendMessage(jid, {
      text:
        "🤝 *PARRAINAGE NOXIS-MD*\n\n" +
        "🏷️ Ton code : *" + stats.code + "*\n" +
        "👥 Filleuls : *" + stats.count + "*\n" +
        "⭐ Points : *" + stats.points + "*" +
        (stats.referredBy ? "\n👤 Parrain : *" + stats.referredBy + "*" : "") +
        nextText +
        "\n\n🔗 Lien de partage :\n" + link + "\n\n" +
        "📌 Utiliser un code : *.parrainage CODE*\n" +
        "🎁 Récompenses : *.parrainage recompenses*\n" +
        "🏆 Classement : *.parrainage top*"
    });
  }
};
