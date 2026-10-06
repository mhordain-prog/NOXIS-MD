module.exports = {
  name: "unbase64",
  aliases: ["decode64", "deb64"],
  category: "tools",
  description: "Décoder du Base64",
  async execute(sock, msg, args, c) {
    const value = args.join("").trim();
    if (!value) return sock.sendMessage(c.sender, { text: "❌ Exemple : .unbase64 SGVsbG8=" });
    try {
      const decoded = Buffer.from(value, "base64").toString("utf8");
      if (!decoded) throw new Error("empty");
      await sock.sendMessage(c.sender, { text: "🔓 Texte :\\n" + decoded });
    } catch {
      await sock.sendMessage(c.sender, { text: "❌ Base64 invalide." });
    }
  }
};