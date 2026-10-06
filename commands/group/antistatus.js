const settings = require("../../lib/settingsStore");

module.exports = {
  name: "antistatus",
  aliases: ["statusprotection", "status"],
  category: "security",
  description: "Activer, désactiver ou vérifier la lecture et les réactions aux statuts",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const action = String(args[0] || "status").toLowerCase();

    if (!["on", "off", "status"].includes(action)) {
      return sock.sendMessage(jid, {
        text: "🛡️ Utilisation : .antistatus on | .antistatus off | .antistatus status"
      });
    }

    const current = settings.get("global");

    if (action === "status") {
      const active = current.statusview || current.statuslike;
      return sock.sendMessage(jid, {
        text: active
          ? "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝚃𝙰𝚃𝚄𝚂 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
          : "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝚃𝙰𝚃𝚄𝚂 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
      });
    }

    const enabled = action === "on";
    await settings.set("global", "statusview", enabled);
    await settings.set("global", "statuslike", enabled);

    return sock.sendMessage(jid, {
      text: enabled
        ? "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝚃𝙰𝚃𝚄𝚂 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂"
        : "◆━━━━━━━━━━━━━━◆\n   ꧁ 🚫 𝙰𝙽𝚃𝙸𝚂𝚃𝙰𝚃𝚄𝚂 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧁"
    });
  }
};
