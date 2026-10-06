const settings = require("../../lib/settingsStore");

module.exports = {
  name: "antispam",
  aliases: ["spamprotection", "spam"],
  category: "security",
  description: "Activer, désactiver ou vérifier la protection anti-spam",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || jid;
    const member = metadata.participants.find(p => p.id === sender);

    if (!member?.admin) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur pour utiliser cette commande." });
    }

    const action = String(args[0] || "status").toLowerCase();
    if (!["on", "off", "status"].includes(action)) {
      return sock.sendMessage(jid, {
        text: "🛡️ Utilisation : .antispam on | .antispam off | .antispam status"
      });
    }

    const current = settings.get(jid);
    if (action === "status") {
      return sock.sendMessage(jid, {
        text: current.antispam
          ? "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝙿𝙰𝙼 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
          : "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝙿𝙰𝙼 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
      });
    }

    const enabled = action === "on";
    await settings.set(jid, "antispam", enabled);

    return sock.sendMessage(jid, {
      text: enabled
        ? "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝙿𝙰𝙼 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
        : "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝙿𝙰𝙼 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
    });
  }
};
