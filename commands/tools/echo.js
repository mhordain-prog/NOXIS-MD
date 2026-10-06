module.exports = {
  name: "echo",
  aliases: ["say", "dire"],
  category: "tools",
  description: "Répéter un texte",
  async execute(sock, msg, args, c) {
    const text = args.join(" ").trim();
    if (!text) return sock.sendMessage(c.sender, { text: "❌ Exemple : .echo Bonjour NOXIS" });
    await sock.sendMessage(c.sender, { text });
  }
};