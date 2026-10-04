const config = require("../../config");

module.exports = {
  name: "owner",
  aliases: ["ownerlist", "owners"],
  category: "owner",
  description: "Show owner information",
  ownerOnly: false,

  async execute(sock, msg, args, context) {
    const { sender } = context;

    const ownerText = `
╔═══════════════════════════════╗
║     👨‍💻 OWNER INFORMATION     ║
╚═══════════════════════════════╝

👑 *Propriétaire principal :*
Nom: Hordain Madila
WhatsApp: ${config.owner}
Statut: Active ✅

🔧 *Informations du bot :*
Nom: ${config.botName}
Version: ${config.version}
Type: WhatsApp Multi-Device

📱 *Contact :*
WhatsApp: ${config.owner}
Support: Disponible

🚀 *Maintenu pour :*
✅ Système de commandes
✅ Gestion de groupe
✅ Sécurité
✅ Réponses automatiques
✅ Intégrations

💻 *Technologies :*
Node.js, Baileys

╚═══════════════════════════════╝
`;

    await sock.sendMessage(sender, { text: ownerText });
  }
};
