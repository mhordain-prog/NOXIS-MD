module.exports = {
  name: "calc",
  aliases: ["calculate", "calcul"],
  category: "tools",
  description: "Calculatrice simple",
  async execute(sock, msg, args, c) {
    const expression = args.join("").replace(/,/g, ".").trim();
    if (!expression) return sock.sendMessage(c.sender, { text: "❌ Exemple : .calc 25*4+10" });
    if (!/^[0-9+\\-*/%(). ]+$/.test(expression) || expression.length > 100) {
      return sock.sendMessage(c.sender, { text: "❌ Expression non autorisée." });
    }
    try {
      const result = Function('"use strict"; return (' + expression + ')')();
      if (!Number.isFinite(result)) throw new Error("invalid");
      await sock.sendMessage(c.sender, { text: `🧮 ${expression} = *${result}*` });
    } catch {
      await sock.sendMessage(c.sender, { text: "❌ Calcul invalide." });
    }
  }
};