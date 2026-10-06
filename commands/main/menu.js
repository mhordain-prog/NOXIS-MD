const config = require("../../config");
const commandLoader = require("../../lib/commandLoader");

function cleanText(value) {
  return String(value || "")
    .replace(/[\\\r]/g, "")
    .trim();
}

function categoryLabel(category) {
  const labels = {
    ai: "🤖 AI",
    anime: "🌸 ANIME",
    audio: "🎵 AUDIO",
    download: "📥 DOWNLOAD",
    fun: "🎭 FUN",
    group: "👥 GROUP",
    logo: "🎨 LOGO",
    main: "🏠 MAIN",
    other: "📦 OTHER",
    owner: "👑 OWNER",
    search: "🔎 SEARCH",
    setting: "⚙️ SETTING",
    settings: "🛠️ SETTINGS",
    sound: "🔊 SOUND",
    tools: "🧰 TOOLS",
    utility: "🔧 UTILITY",
    security: "🛡️ SECURITY",
    media: "🎬 MEDIA",
    internet: "🌐 INTERNET",
    education: "📚 EDUCATION",
    developer: "💻 DEVELOPER",
    profile: "👤 PROFILE",
    economy: "💰 ECONOMY",
    bank: "🏦 BANK",
    cloud: "☁️ CLOUD"
  };
  const key = String(category || "other").toLowerCase();
  return labels[key] || "📁 " + key.toUpperCase();
}

function commandLine(command, prefix) {
  const aliases = Array.isArray(command.aliases)
    ? command.aliases.filter(Boolean).slice(0, 3)
    : [];
  const names = [command.name, ...aliases].filter(Boolean);
  const usage = prefix + names[0];
  const extra = aliases.length ? " (" + aliases.map(a => prefix + a).join(", ") + ")" : "";
  return "│ • " + usage + extra;
}

function buildParts(commands, prefix, maxChars = 5200) {
  const grouped = new Map();

  for (const command of commands) {
    const category = String(command.category || "other").toLowerCase();
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(command);
  }

  const orderedCategories = [
    "main", "ai", "anime", "audio", "download", "fun", "group",
    "logo", "media", "search", "owner", "setting", "settings",
    "security", "sound", "tools", "utility", "internet", "education",
    "cloud", "developer", "profile", "economy", "bank", "other"
  ];

  const categories = [
    ...orderedCategories.filter(c => grouped.has(c)),
    ...Array.from(grouped.keys()).filter(c => !orderedCategories.includes(c))
  ];

  const blocks = [];
  for (const category of categories) {
    const list = grouped.get(category).slice().sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "fr")
    );

    const lines = [categoryLabel(category)];
    for (const command of list) lines.push(commandLine(command, prefix));
    blocks.push(lines.join("\n"));
  }

  const parts = [];
  let current = "";
  for (const block of blocks) {
    const candidate = current ? current + "\n\n" + block : block;
    if (candidate.length > maxChars && current) {
      parts.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

async function getBotPhoto(sock) {
  try {
    const id = sock.user?.id;
    if (!id) return null;
    return await sock.profilePictureUrl(id, "image");
  } catch {
    return null;
  }
}

function makeCaption(part, totalParts, commandsCount, prefix) {
  const partTitle = totalParts > 1 ? " • PARTIE " + part + "/" + totalParts : "";
  const mode = String(config.botMode || "public").toUpperCase();

  return [
    "꧁༒☬ *NOXIS-MD* ☬༒꧂" + partTitle,
    "",
    "👑 *OWNER:* " + config.owner,
    "⚡ *COMMANDES:* " + commandsCount,
    "🔰 *PREFIX:* " + prefix,
    "🌐 *MODE:* " + mode,
    "📦 *VERSION:* " + config.version,
    "",
    "╭━━━〔 ⚡ NOXIS 〕━━━╮",
    part,
    "╰━━━━━━━━━━━━━━━━━━╯"
  ].join("\n");
}

module.exports = {
  name: "menu",
  aliases: ["help", "aide", "commands", "commandes"],
  category: "main",
  description: "Afficher le menu complet NOXIS-MD",

  async execute(sock, msg, args) {
    if (!commandLoader.getCommands().length) {
      await commandLoader.loadCommands();
    }

    const commands = commandLoader.getCommands();
    const prefix = config.prefix || ".";
    const parts = buildParts(commands, prefix);
    const totalParts = Math.max(parts.length, 1);
    const photo = await getBotPhoto(sock);

    for (let i = 0; i < totalParts; i++) {
      const caption = makeCaption(parts[i], i + 1, commands.length, prefix);

      if (i === 0 && photo) {
        try {
          await sock.sendMessage(
            msg.key.remoteJid,
            { image: { url: photo }, caption },
            { quoted: msg }
          );
          continue;
        } catch (error) {
          console.error("NOXIS menu image error:", error.message);
        }
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: caption },
        { quoted: i === 0 ? msg : undefined }
      );
    }
  }
};
