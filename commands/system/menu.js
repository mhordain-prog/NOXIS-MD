const config = require("../../config");
const settings = require("../../lib/settingsStore");
const commandLoader = require("../../lib/commandLoader");

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands"],
  category: "system",
  description: "Menu principal complet, classé par catégorie",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const commands = commandLoader.getCommands();
    const groups = {};

    for (const command of commands) {
      const category = String(command.category || "other").toLowerCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(command);
    }

    const labels = {
      group: "👥 GESTION DU GROUPE", admin: "🛡️ ADMINISTRATION", security: "🔐 SÉCURITÉ",
      system: "⚙️ SYSTÈME", ai: "🧠 INTELLIGENCE ARTIFICIELLE", downloader: "📥 TÉLÉCHARGEMENT",
      download: "📥 MÉDIAS & TÉLÉCHARGEMENTS", search: "🔎 RECHERCHE", anime: "🎭 ANIME",
      media: "🖼️ MÉDIAS", tools: "🛠️ OUTILS", fun: "🎉 FUN / DIVERTISSEMENT",
      games: "🎮 JEUX", education: "📚 ÉDUCATION", internet: "🌐 INTERNET", profile: "👤 PROFIL",
      owner: "👑 OWNER", settings: "⚙️ RÉGLAGES", design: "🎨 DESIGN", developer: "💻 DÉVELOPPEUR",
      economy: "💰 ÉCONOMIE", bank: "🏦 BANQUE", cloud: "☁️ CLOUD", other: "📦 AUTRES"
    };

    const query = String(args?.[0] || "").toLowerCase().trim();

    if (query) {
      const command = commandLoader.getCommand(query);
      if (command) {
        const aliases = Array.isArray(command.aliases) && command.aliases.length
          ? command.aliases.map(a => "." + a).join(", ") : "Aucun";
        return sock.sendMessage(jid, {
          text:
            "📖 *AIDE — ." + command.name + "*\n\n" +
            "📝 Description : " + (command.description || "Aucune description.") + "\n" +
            "📂 Catégorie : " + (command.category || "other") + "\n" +
            "🔁 Alias : " + aliases + "\n\n" +
            "💡 Utilisation : ." + command.name
        });
      }

      const category = query === "groupe" ? "group" : query;
      if (groups[category]) {
        const names = [...new Set(groups[category].map(c => c.name))].sort();
        return sock.sendMessage(jid, {
          text:
            "📂 *" + (labels[category] || category.toUpperCase()) + "*\n\n" +
            names.map((n, i) => (i + 1) + ". ." + n).join("\n") +
            "\n\n💡 .menu pour afficher toutes les catégories."
        });
      }

      return sock.sendMessage(jid, {
        text: "❌ Commande ou catégorie introuvable : " + query + "\n💡 Essaie .menu"
      });
    }

    const order = [
      "group","admin","security","system","ai","download","downloader","search","anime",
      "media","tools","fun","games","education","internet","profile","owner","settings",
      "design","developer","economy","bank","cloud","other"
    ];

    const sections = [];
    for (const category of order) {
      const list = groups[category];
      if (!list?.length) continue;
      const names = [...new Set(list.map(c => c.name))]
        .sort((a, b) => a.localeCompare(b));

      sections.push(
        "╭━━━〔 " + (labels[category] || category.toUpperCase()) + " 〕━━━╮\n" +
        names.map((name, i) => (i + 1) + ". ." + name).join("\n") +
        "\n╰━━━━━━━━━━━━━━━━━━━━╯"
      );
    }

    const runtime = Math.floor(process.uptime());
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);
    const s = runtime % 60;
    const currentSettings = settings.get("global") || {};
    const prefix = currentSettings.prefix || ".";

    const header =
      "🤖 *NOXIS-MD — MENU PRINCIPAL*\n" +
      "👑 Owner : Hordain Madila\n" +
      "📦 Commandes actives : " + commands.length + "\n" +
      "⏱️ Uptime : " + h + "h " + m + "m " + s + "s\n" +
      "🏷️ Version : " + config.version + "\n" +
      "⚙️ Préfixe : " + prefix + "\n\n";

    const MAX_CHARS = 4500;
    const chunks = [];
    let current = "";

    for (const section of sections) {
      const candidate = current ? current + "\n\n" + section : section;
      if (candidate.length > MAX_CHARS && current) {
        chunks.push(current);
        current = section;
      } else {
        current = candidate;
      }
    }

    if (current) chunks.push(current);

    if (!chunks.length) {
      return sock.sendMessage(jid, { text: header + "❌ Aucune commande chargée." });
    }

    for (let i = 0; i < chunks.length; i++) {
      await sock.sendMessage(jid, {
        text:
          header +
          "📚 *MENU COMPLET — PARTIE " + (i + 1) + "/" + chunks.length + "*\n\n" +
          chunks[i]
      });
    }
  }
};