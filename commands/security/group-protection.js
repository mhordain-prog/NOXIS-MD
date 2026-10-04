const protection = require("../../lib/groupProtection");

async function adminOnly(sock, msg, ctx) {
  if (!ctx.isGroup) {
    await sock.sendMessage(ctx.sender, { text: "❌ Groupe uniquement." });
    return false;
  }
  const meta = await sock.groupMetadata(ctx.sender);
  const participant = meta.participants.find(p => p.id === ctx.senderNumber);
  if (!participant?.admin) {
    await sock.sendMessage(ctx.sender, { text: "❌ Réservé aux admins." });
    return false;
  }
  return true;
}

module.exports = [
  {
    name: "antilink",
    aliases: ["anti-link", "linkguard"],
    category: "security",
    description: "Active ou désactive l'anti-lien",
    async execute(sock, msg, args, ctx) {
      if (!await adminOnly(sock, msg, ctx)) return;
      const mode = String(args[0] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) return sock.sendMessage(ctx.sender, { text: "🛡️ Utilisation : .antilink on/off" });
      await protection.set(ctx.sender, "antilink", mode === "on");
      return sock.sendMessage(ctx.sender, { text: "🛡️ Anti-link : " + (mode === "on" ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌") });
    }
  },
  {
    name: "antispam",
    aliases: ["anti-spam", "spamguard"],
    category: "security",
    description: "Active ou désactive l'anti-spam",
    async execute(sock, msg, args, ctx) {
      if (!await adminOnly(sock, msg, ctx)) return;
      const mode = String(args[0] || "").toLowerCase();
      if (!["on", "off"].includes(mode)) return sock.sendMessage(ctx.sender, { text: "🛡️ Utilisation : .antispam on/off" });
      await protection.set(ctx.sender, "antispam", mode === "on");
      return sock.sendMessage(ctx.sender, { text: "🛡️ Anti-spam : " + (mode === "on" ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌") });
    }
  },
  {
    name: "protection",
    aliases: ["protectgroup", "securitygroup"],
    category: "security",
    description: "Affiche l'état des protections",
    async execute(sock, msg, args, ctx) {
      if (!ctx.isGroup) return sock.sendMessage(ctx.sender, { text: "❌ Groupe uniquement." });
      const p = protection.get(ctx.sender);
      return sock.sendMessage(ctx.sender, { text: "🛡️ NOXIS PROTECTION\n\n🔗 Anti-link : " + (p.antilink ? "ON" : "OFF") + "\n🚫 Anti-spam : " + (p.antispam ? "ON" : "OFF") + "\n\nCommandes : .antilink on/off • .antispam on/off" });
    }
  }
];