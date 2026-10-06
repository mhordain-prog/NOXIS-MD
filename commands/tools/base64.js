module.exports = {
  name: "base64",
  aliases: ["encode64", "b64"],
  category: "tools",
  description: "Encoder un texte en Base64",
  async execute(sock, msg, args, c) {
    const text = args.join(" ");
    if (!text) return sock.sendMessage(c.sender, { text: "❌ Exemple : .base64 Bonjour" });
    await sock.sendMessage(c.sender, { text: "🔐 Base64 :\\n" + Buffer.from(text, "utf8").toString("base64") });
  }
};