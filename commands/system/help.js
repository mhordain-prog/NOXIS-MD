module.exports = {
  name: "help",
  aliases: ["h", "?"],
  category: "system",
  description: "Show help information",
  async execute(sock, msg, args, context) {
    const { sender, args: cmdArgs } = context;
    if (cmdArgs.length > 0) {
      await sock.sendMessage(sender, { text:
        "📖 AIDE: " + cmdArgs[0] + "\n\nUtilisation: ." + cmdArgs[0] + " [options]\n\nUtilise .menu pour voir les commandes actives."
      });
      return;
    }
    await sock.sendMessage(sender, { text:
      "╭──────────────────────────╮\n│      📖 NOXIS-MD AIDE    │\n╰──────────────────────────╯\n\n" +
      "🎯 .menu — Toutes les commandes\n🏓 .ping — Tester le bot\n👑 .owner — Propriétaire\n👤 .profile — Profil\n👥 .group — Groupe\n🧠 .ai — IA\n📥 .download — Téléchargements publics\n🎭 .anime — Recherche anime\n🔍 .search — Recherche\n🌐 .internet — Vérifier un site\n🎮 .game — Mini-jeu\n\n📝 .help commande — Aide ciblée"
    });
  }
};
