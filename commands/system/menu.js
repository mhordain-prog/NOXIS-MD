const config = require("../../config");
const settings = require("../../lib/settingsStore");
const commandLoader = require("../../lib/commandLoader");

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands"],
  category: "system",
  description: "Menu principal NOXIS-MD",

  async execute(sock, msg, args, context) {
    const { sender } = context;
    const commands = commandLoader.getCommands();
    const groups = {};

    for (const command of commands) {
      const category = String(command.category || "other").toLowerCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(command.name);
    }

    const labels = {
      tools: "🛠️ ᴛᴏᴏʟs",
      ai: "🧠 ᴀɪ",
      anime: "🎭 ᴀɴɪᴍᴇ",
      media: "🖼️ ᴍᴇᴅɪᴀ",
      owner: "👑 ᴏᴡɴᴇʀ",
      admin: "🛡️ ᴀᴅᴍɪɴ",
      group: "👥 ɢʀᴏᴜᴘ",
      downloader: "📥 ᴅᴏᴡɴʟᴏᴀᴅ",
      system: "⚙️ ᴍᴀɪɴ",
      search: "🔎 sᴇᴀʀᴄʜ",
      fun: "🎮 ғᴜɴ",
      education: "📚 ᴇᴅᴜᴄᴀᴛɪᴏɴ",
      security: "🔐 sᴇᴄᴜʀɪᴛʏ",
      internet: "🌐 ɪɴᴛᴇʀɴᴇᴛ",
      design: "🎨 ᴅᴇsɪɢɴ",
      games: "🎮 ɢᴀᴍᴇs",
      economy: "💰 ᴇᴄᴏɴᴏᴍʏ",
      bank: "🏦 ʙᴀɴᴋ",
      cloud: "☁️ ᴄʟᴏᴜᴅ",
      developer: "🚀 ᴅᴇᴠᴇʟᴏᴘᴇʀ",
      settings: "⚙️ sᴇᴛᴛɪɴɢs",
      profile: "👤 ᴘʀᴏғɪʟᴇ + ᴅᴘ",
      other: "📦 ᴏᴛʜᴇʀ"
    };

    const preferred = [
      "tools","ai","anime","media","owner","admin","group","downloader",
      "system","search","fun","education","security","internet","design",
      "games","economy","bank","cloud","developer","profile","settings","other"
    ];

    let sections = "";

    for (const category of preferred) {
      const list = groups[category];
      if (!list?.length) continue;

      const unique = [...new Set(list)].sort();
      sections +=
        `━━━━━『 ${labels[category] || category.toUpperCase()} 』━━━━━\\n◉\\n` +
        unique.map(name => `◉ ➤ ${name}`).join("\n") +
        `\\n◉\\n┗━━━━━━━━━━━━━━\\n`;
    }

    const active = new Set(commands.map(c => c.name)).size;
    const runtime = Math.floor(process.uptime());
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);
    const s = runtime % 60;

    const currentSettings = settings.get("global");

    const menuText =
      `\\n━━━━━━ 🤖 ʙᴏᴛ ɪɴғᴏ ━━━━━━\\n` +
      `◉ 🎉 ꧁༒☬ NOXIS ☬༒꧂\\n` +
      `◉ 👑 ᴏᴡɴᴇʀ: Hordain Madila\\n` +
      `◉ 📜 ᴄᴏᴍᴍᴀɴᴅs: ${active}\\n` +
      `◉ ⏱️ ʀᴜɴᴛɪᴍᴇ: ${h}h ${m}m ${s}s\\n` +
      `◉ 📦 ᴘʀᴇғɪx: ${currentSettings.prefix}\\n` +
      `◉ ⚙️ ᴍᴏᴅᴇ: ${currentSettings.mode}\\n` +
      `◉ 🏷️ ᴠᴇʀsɪᴏɴ: ${config.version}\\n\\n` +
      sections +
      `\\n> *© ꨄ 𝙉𝙊𝙓𝙄𝙎-𝙈𝘿 ꨄ*`;

    await sock.sendMessage(sender, { text: menuText });
  }
};
