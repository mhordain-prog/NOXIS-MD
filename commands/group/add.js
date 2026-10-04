module.exports = {
  name: "add",
  aliases: ["ajouter"],
  category: "group",
  description: "Ajouter un numéro au groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groupe uniquement." });
    const sender = msg.key.participant || msg.key.remoteJid;
    const meta = await sock.groupMetadata(jid);
    const me = meta.participants.find(p => p.id === sender);
    const botId = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
    const bot = meta.participants.find(p => p.id === botId);
    if (!["admin","superadmin"].includes(me?.admin)) return sock.sendMessage(jid, { text: "❌ Admin requis." });
    if (!bot?.admin) return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur." });

    const number = (args[0] || "").replace(/\D/g, "");
    if (!number || number.length < 7) return sock.sendMessage(jid, { text: "❌ Utilisation : .add 242XXXXXXXXX" });

    const result = await sock.groupParticipantsUpdate(jid, [number + "@s.whatsapp.net"], "add");
    return sock.sendMessage(jid, { text: `📥 Résultat : ${JSON.stringify(result)}` });
  }
};