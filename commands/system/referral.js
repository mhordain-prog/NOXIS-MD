const referral = require("../../lib/referralStore");

module.exports = {
  name: "parrainage",
  aliases: ["ref", "referral", "invite", "inviter"],
  category: "system",
  description: "Génère ton code de parrainage, affiche tes filleuls ou utilise le code d'un autre membre.",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const userId = msg.key.participant || jid;
    const action = String(args?.[0] || "").trim();

    if (action) {
      const result = referral.applyReferral(userId, action);
      const messages = {
        invalid: "❌ Code de parrainage invalide.",
        self: "❌ Tu ne peux pas utiliser ton propre code de parrainage.",
        already: "ℹ️ Ton parrainage est déjà enregistré. Il ne peut pas être remplacé."
      };
      if (!result.ok) {
        return sock.sendMessage(jid, { text: messages[result.reason] || "❌ Impossible d'enregistrer ce parrainage." });
      }
      return sock.sendMessage(jid, {
        text: "✅ *Parrainage enregistré !*\n\n👤 Parrain : " + result.referrer.code + "\n🎁 Ton compte est maintenant rattaché à ce parrain."
      });
    }

    const stats = referral.getStats(userId);
    return sock.sendMessage(jid, {
      text:
        "🤝 *PARRAINAGE NOXIS-MD*\n\n" +
        "🏷️ Ton code : *" + stats.code + "*\n" +
        "👥 Filleuls : *" + stats.count + "*\n\n" +
        "📌 Pour utiliser un code : *.parrainage CODE*\n" +
        "📤 Partage simplement ton code à tes amis."
    });
  }
};
