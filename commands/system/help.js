module.exports = {
  name: "help",
  aliases: ["h", "?"],
  category: "system",
  description: "Show help information",

  async execute(sock, msg, args, context) {
    const { sender, args: cmdArgs } = context;

    if (cmdArgs.length > 0) {
      const helpText = `
📖 *Aide pour la commande :* ${cmdArgs[0]}

ℹ️ *Informations :*
Commande: ${cmdArgs[0]}
Statut: Disponible ✅
Utilisation: .${cmdArgs[0]} [options]

📝 Description:
Cette commande fournit les fonctionnalités disponibles dans NOXIS-MD.

⚠️ Pour plus d'informations, utilise .menu
`;
      await sock.sendMessage(sender, { text: helpText });
    } else {
      const generalHelp = `
╭──────────────────────────╮
│      📖 NOXIS-MD AIDE    │
╰──────────────────────────╯

🎯 *Démarrage rapide :*
.menu - Voir le menu
.ping - Vérifier le statut
.owner - Informations du propriétaire

📚 *Catégories :*
.owner <category> - Commandes propriétaire
.system <category> - Commandes système
.profile <category> - Profil
.group <category> - Gestion du groupe
.ai <category> - Intelligence artificielle
.download <category> - Téléchargements
.game <category> - Jeux
.economy <category> - Économie
.bank <category> - Banque

❓ *Besoin d'aide ?*
Utilise .menu pour la liste complète.
Utilise .help <commande> pour une aide précise.
`;
      await sock.sendMessage(sender, { text: generalHelp });
    }
  }
};
