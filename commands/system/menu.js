const config = require("../../config");
const settings = require("../../lib/settingsStore");
const commandLoader = require("../../lib/commandLoader");

const labels = {
  group: "👥 GESTION DU GROUPE",
  admin: "🛡️ ADMINISTRATION",
  security: "🔐 SÉCURITÉ",
  system: "⚙️ SYSTÈME",
  ai: "🧠 INTELLIGENCE ARTIFICIELLE",
  anime: "🎭 ANIME",
  audio: "🎵 AUDIO",
  download: "📥 MÉDIAS & TÉLÉCHARGEMENTS",
  downloader: "📥 DOWNLOADER",
  search: "🔎 RECHERCHE",
  media: "🖼️ MÉDIAS",
  tools: "🛠️ OUTILS",
  fun: "🎉 FUN / DIVERTISSEMENT",
  games: "🎮 JEUX",
  education: "📚 ÉDUCATION",
  internet: "🌐 INTERNET",
  profile: "👤 PROFIL",
  owner: "👑 OWNER",
  settings: "⚙️ RÉGLAGES",
  design: "🎨 DESIGN",
  developer: "💻 DÉVELOPPEUR",
  economy: "💰 ÉCONOMIE",
  bank: "🏦 BANQUE",
  cloud: "☁️ CLOUD",
  main: "🏠 PRINCIPAL",
  other: "📦 AUTRES"
};

const order = [
  "main", "group", "admin", "security", "system", "ai", "anime", "audio",
  "download", "downloader", "search", "media", "tools", "fun", "games",
  "education", "internet", "profile", "owner", "settings", "design",
  "developer", "economy", "bank", "cloud", "other"
];

async function getBotPhoto(sock) {
  try {
    if (!sock.user?.id) return null;
    return await sock.profilePictureUrl(sock.user.id, "image");
  } catch {
    return null;
  }
}

function buildMenu(commands, prefix) {
  const groups = {};

  for (const command of commands) {
    const category = String(command.category || "other").toLowerCase();
    if (!groups[category]) groups[category] = [];
    groups[category].push(command);
  }

  const categories = [
    ...order.filter(c => groups[c]?.length),
    ...Object.keys(groups).filter(c => !order.includes(c))
  ];

  const sections = [];

  for (const category of categories) {
    const names = [...new Set(groups[category].map(c => c.name))]
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b), "fr"));

    sections.push(
      "╭━━━〔 " + (labels[category] || category.toUpperCase()) + " 〕━━━╮\n" +
      names.map(name => "│ • " + prefix + name).join("\n") +
      "\n╰━━━━━━━━━━━━━━━━━━━━╯"
    );
  }

  const runtime = Math.floor(process.uptime());
  const h = Math.floor(runtime / 3600);
  const m = Math.floor((runtime % 3600) / 60);
  const s = runtime % 60;
  const mode = String(config.botMode || "public").toUpperCase();

  return [
    "꧁༒☬ *NOXIS-MD* ☬༒꧂",
    "",
    "👑 *OWNER:* " + (config.owner || "Hordain Madila"),
    "⚡ *COMMANDES:* " + commands.length,
    "⏱️ *RUNTIME:* " + h + "h " + m + "m " + s + "s",
    "🔰 *PREFIX:* " + prefix,
    "🌐 *MODE:* " + mode,
    "📦 *VERSION:* " + (config.version || "N/A"),
    "",
    "╭━━━〔 ⚡ NOXIS — MENU COMPLET 〕━━━╮",
    ...sections,
    "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯"
  ].join("\n\n");
}

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands", "aide", "commandes"],
  category: "system",
  description: "Afficher le menu complet NOXIS-MD en un seul menu",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!commandLoader.getCommands().length) await commandLoader.loadCommands();

    const commands = commandLoader.getCommands();
    const currentSettings = settings.get("global") || {};
    const prefix = currentSettings.prefix || config.prefix || ".";
    const query = String(args?.[0] || "").toLowerCase().trim();

    if (query) {
      const command = commandLoader.getCommand(query);
      if (command) {
        const aliases = Array.isArray(command.aliases) && command.aliases.length
          ? command.aliases.map(a => prefix + a).join(", ")
          : "Aucun";
        return sock.sendMessage(jid, {
          text:
            "📖 *AIDE — " + prefix + command.name + "*\n\n" +
            "📝 Description : " + (command.description || "Aucune description.") + "\n" +
            "📂 Catégorie : " + (command.category || "other") + "\n" +
            "🔁 Alias : " + aliases + "\n\n" +
            "💡 Utilisation : " + prefix + command.name
        });
      }
    }

    const menuText = buildMenu(commands, prefix);
    const photo = await getBotPhoto(sock);

    // La photo est uniquement l'en-tête visuel; le menu complet reste dans un seul message texte.
    if (photo) {
      try {
        await sock.sendMessage(jid, {
          image: { url: photo },
          caption: "꧁༒☬ *NOXIS-MD* ☬༒꧂\n⚡ *MENU COMPLET*"
        }, { quoted: msg });
      } catch (error) {
        console.error("NOXIS menu photo error:", error.message);
      }
    }

    return sock.sendMessage(jid, { text: menuText }, { quoted: msg });
  }
};
