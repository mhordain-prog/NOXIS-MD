const settings = require("../../lib/settingsStore");

module.exports = {
  name: "antispam",
  aliases: ["spamprotection", "spam"],
  description: "Activer ou désactiver la protection anti-spam",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const member = metadata.participants.find(p => p.id === sender);

    if (!member || !["admin", "superadmin"].includes(member.admin)) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur pour utiliser cette commande." });
    }

    const action = String(args[0] || "").toLowerCase();

    if (!["on", "off"].includes(action)) {
      const current = settings.get(jid);
      return sock.sendMessage(jid, {
        text: `🛡️ ANTISPAM : ${current.antispam ? "ON" : "OFF"}\n\nUtilise : antispam on ou antispam off`
      });
    }

    await settings.set(jid, "antispam", action === "on");
    await sock.sendMessage(jid, {
      text: action === "on"
        ? "🛡️ Anti-spam activé. Plus de 5 messages en 5 secondes peuvent être bloqués."
        : "🛡️ Anti-spam désactivé."
    });
  }
};