const settings = require("../../lib/settingsStore");

module.exports = {
  name: "welcome",
  aliases: ["welcomemsg", "bienvenue"],
  category: "group",
  description: "Activer ou désactiver les messages de bienvenue",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    const m = await sock.groupMetadata(jid);
    const sender = msg.key.participant || jid;
    if (!m.participants.find(p => p.id === sender)?.admin) return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur." });

    const action = String(args[0] || "status").toLowerCase();
    if (!["on", "off", "status"].includes(action)) {
      return sock.sendMessage(jid, { text: "👋 Utilisation : .welcome on | .welcome off | .welcome status" });
    }

    const cur = settings.get(jid);
    const activeText = "◆━━━━━━━━━━━━━━◆\n   ꧁ 👋 𝙒𝙴𝙻𝙲𝙾𝙼𝙴 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂";
    const inactiveText = "◆━━━━━━━━━━━━━━◆\n   ꧁ 👋 𝙒𝙴𝙻𝙲𝙾𝙼𝙴 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂";

    if (action === "status") return sock.sendMessage(jid, { text: cur.welcome ? activeText : inactiveText });

    await settings.set(jid, "welcome", action === "on");
    return sock.sendMessage(jid, { text: action === "on" ? activeText : inactiveText });
  }
};