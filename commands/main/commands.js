const commandLoader = require("../../lib/commandLoader");

module.exports = {
  name: "commands",
  aliases: ["allcmd", "listecommandes"],
  category: "main",
  description: "Afficher le nombre de commandes chargées",
  async execute(sock, msg, args, c) {
    if (!commandLoader.getCommands().length) await commandLoader.loadCommands();
    const commands = commandLoader.getCommands();
    const categories = new Map();
    for (const command of commands) {
      const cat = String(command.category || "other").toLowerCase();
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }
    const lines = [...categories.entries()]
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([cat,n]) => `• ${cat}: ${n}`);
    await sock.sendMessage(c.sender, {
      text: `📦 *NOXIS-MD — COMMANDES RÉELLES*\\n\\n⚡ Total : *${commands.length}*\\n\\n${lines.join("\\n")}`
    });
  }
};