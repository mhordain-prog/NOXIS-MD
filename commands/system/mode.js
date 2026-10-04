const settings = require("../../lib/settingsStore");

module.exports = {
  name: "mode",
  aliases: ["botmode", "accessmode"],
  category: "system",
  description: "Choisir ton mode d'utilisation : public ou privé",

  async execute(sock, msg, args, context) {
    const jid = msg.key.remoteJid;
    const senderNumber = context.senderNumber;
    const scope = "user:" + String(senderNumber || "").replace(/[^0-9]/g, "");
    const requested = String(args?.[0] || "").toLowerCase();

    if (!requested || !["public", "private", "privé"].includes(requested)) {
      const current = settings.get(scope).mode || "public";
      return sock.sendMessage(jid, {
        text:
          "⚙️ *MODE NOXIS-MD*\n\n" +
          "Mode actuel : *" + current + "*\n\n" +
          "• .mode public — tout le monde peut utiliser le bot\n" +
          "• .mode private — le bot ne répond qu'à toi\n\n" +
          "💡 Ce réglage est personnel : il ne change pas le mode des autres utilisateurs."
      });
    }

    const mode = requested === "privé" ? "private" : requested;
    await settings.set(scope, "mode", mode);

    return sock.sendMessage(jid, {
      text:
        mode === "private"
          ? "🔒 *Mode privé activé.*\n\nNOXIS-MD répondra uniquement à toi. Les commandes Owner/SUDO restent protégées."
          : "🌍 *Mode public activé.*\n\nNOXIS-MD peut de nouveau être utilisé normalement par tout le monde."
    });
  }
};
