const config = require("../../config");
const settings = require("../../lib/settingsStore");
const commandLoader = require("../../lib/commandLoader");

const labels = {
  main: "🏠 PRINCIPAL", group: "👥 GESTION DU GROUPE", admin: "🛡️ ADMINISTRATION",
  security: "🔐 SÉCURITÉ", system: "⚙️ SYSTÈME", ai: "🧠 INTELLIGENCE ARTIFICIELLE",
  anime: "🎭 ANIME", audio: "🎵 AUDIO", download: "📥 MÉDIAS & TÉLÉCHARGEMENTS",
  downloader: "📥 DOWNLOADER", search: "🔎 RECHERCHE", media: "🖼️ MÉDIAS",
  tools: "🛠️ OUTILS", fun: "🎉 FUN / DIVERTISSEMENT", games: "🎮 JEUX",
  education: "📚 ÉDUCATION", internet: "🌐 INTERNET", profile: "👤 PROFIL",
  owner: "👑 OWNER", settings: "⚙️ RÉGLAGES", design: "🎨 DESIGN",
  developer: "💻 DÉVELOPPEUR", economy: "💰 ÉCONOMIE", bank: "🏦 BANQUE",
  cloud: "☁️ CLOUD", other: "📦 AUTRES"
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

function formatUptime() {
  const total = Math.floor(process.uptime());
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h + "h " + m + "m " + s + "s";
}

function getDateInfo() {
  const now = new Date();
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const pad = n => String(n).padStart(2, "0");
  return {
    today: days[now.getDay()],
    date: pad(now.getDate()) + "/" + pad(now.getMonth() + 1) + "/" + now.getFullYear()
  };
}

function buildInfo(commands, prefix) {
  const date = getDateInfo();
  const mode = String(config.botMode || "public").toUpperCase();

  return [
    "╭━━━〔 ⚡ INFO BOT 〕━━━╮",
    "┃",
    "┃ 👑 OWNER : " + (config.owner || "Hordain Madila"),
    "┃ ⚡ VERSION : " + (config.version || "2.0.0"),
    "┃ 🔰 PREFIX : " + prefix,
    "┃ 📦 COMMANDES : " + commands.length,
    "┃ 📅 TODAY : " + date.today,
    "┃ 🗓️ DATE : " + date.date,
    "┃ ⏱️ UPTIME : " + formatUptime(),
    "┃ 🟢 RUNTIME : " + process.version,
    "┃ 🌐 MODE : " + mode,
    "┃",
    "╰━━━━━━━━━━━━━━━━━━━━━━╯"
  ].join("\n");
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

  return [
    "╭━━━〔 ꧁༒☬ NOXIS-MD ☬༒꧂ 〕━━━╮",
    "│",
    "│ ⚡ MENU COMPLET — COMMANDES RÉELLES : " + commands.length,
    "│ 💬 Utilise " + prefix + "menu <commande> pour l'aide",
    "│",
    "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯",
    "",
    ...sections,
    "",
    "╭━━━〔 ☠️ NOXIS 〕━━━╮",
    "│ Noxis ne cherche pas la lumière,",
    "│ Noxis crée son propre chemin.",
    "╰━━━━━━━━━━━━━━━━━━━━╯"
  ].join("\n\n");
}

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands", "aide", "commandes"],
  category: "system",
  description: "Afficher le menu complet NOXIS-MD",

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

    const infoText = buildInfo(commands, prefix);
    const menuText = buildMenu(commands, prefix);
    const photo = await getBotPhoto(sock);

    if (photo) {
      try {
        await sock.sendMessage(jid, {
          image: { url: photo },
          caption: "꧁༒☬ *NOXIS-MD* ☬༒꧂\n\n" + infoText
        }, { quoted: msg });
      } catch (error) {
        console.error("NOXIS menu photo error:", error.message);
        await sock.sendMessage(jid, { text: infoText }, { quoted: msg });
      }
    } else {
      await sock.sendMessage(jid, { text: infoText }, { quoted: msg });
    }

    if (menuText.length > 60000) {
      return sock.sendMessage(jid, {
        text: "⚠️ Le menu complet dépasse la taille maximale de WhatsApp. Utilise " + prefix + "menu <commande> pour consulter une commande."
      }, { quoted: msg });
    }

    return sock.sendMessage(jid, { text: menuText }, { quoted: msg });
  }
};
