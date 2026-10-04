const settings = require("../../lib/settingsStore");

module.exports = {
  name: "goodbye",
  aliases: ["goodbyemsg", "aurevoir"],
  category: "group",
  description: "Activer ou désactiver les messages de départ",
  async execute(sock, msg, args) {
    const jid=msg.key.remoteJid;
    if(!jid?.endsWith("@g.us")) return sock.sendMessage(jid,{text:"❌ Cette commande fonctionne uniquement dans un groupe."});
    const m=await sock.groupMetadata(jid);
    const sender=msg.key.participant||jid;
    if(!m.participants.find(p=>p.id===sender)?.admin) return sock.sendMessage(jid,{text:"❌ Tu dois être administrateur."});
    const action=String(args[0]||"status").toLowerCase();
    if(!["on","off","status"].includes(action)) return sock.sendMessage(jid,{text:"👋 Utilisation : .goodbye on | .goodbye off | .goodbye status"});
    const cur=settings.get(jid);
    if(action==="status") return sock.sendMessage(jid,{text:"👋 DÉPART\n\nStatut : "+(cur.goodbye?"🟢 ACTIVÉ":"🔴 DÉSACTIVÉ")+"\nMessage : "+cur.goodbyeText});
    await settings.set(jid,"goodbye",action==="on");
    return sock.sendMessage(jid,{text:action==="on"?"👋 Messages de départ activés.":"👋 Messages de départ désactivés."});
  }
};