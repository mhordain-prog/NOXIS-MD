const settings = require("../../lib/settingsStore");
const config = require("../../config");

const bool = v => ["on","off","true","false"].includes(String(v).toLowerCase());
const value = v => ["on","true"].includes(String(v).toLowerCase());
const send = (sock, to, text) => sock.sendMessage(to, { text });

async function ownerOnly(sock, ctx) {
  const owner = String(config.owner || "").replace(/\D/g, "");
  const sender = String(ctx.senderNumber || "").replace(/\D/g, "");
  if (!ctx.isGroup || sender !== owner && !ctx.sender?.endsWith?.("@s.whatsapp.net")) {
    if (sender !== owner) { await send(sock, ctx.sender, "❌ Commande réservée au propriétaire."); return false; }
  }
  return true;
}

async function setBool(sock, ctx, key, args, label) {
  const mode = String(args[0] || "").toLowerCase();
  if (!bool(mode)) return send(sock, ctx.sender, "⚙️ Utilisation : ." + key + " on/off");
  await settings.set(ctx.isGroup ? ctx.sender : "global", key, value(mode));
  return send(sock, ctx.sender, "⚙️ " + label + " : " + (value(mode) ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"));
}

const list = [
  ["mode","mode","public/private"], ["welcome","welcome","welcome"], ["goodbye","goodbye","goodbye"],
  ["antilink","antilink","anti-link"], ["antidelete","antidelete","anti-delete"],
  ["antiedit","antiedit","anti-edit"], ["autoread","autoread","auto-read"],
  ["autotyping","autotyping","auto-typing"], ["autoreact","autoreact","auto-react"],
  ["recording","recording","recording"], ["online","online","online"], ["statusview","statusview","status-view"],
  ["statuslike","statuslike","status-like"], ["anticall","anticall","anti-call"], ["adminaction","adminaction","admin-action"]
];

const commands = list.map(([name, key, label]) => ({
  name, aliases: [], category: "settings", description: "Réglage " + label,
  async execute(sock, msg, args, ctx) {
    if (name === "mode") {
      const m = String(args[0] || "").toLowerCase();
      if (!["public","private"].includes(m)) return send(sock, ctx.sender, "⚙️ Utilisation : .mode public/private");
      await settings.set("global", "mode", m); return send(sock, ctx.sender, "⚙️ Mode : " + m);
    }
    return setBool(sock, ctx, key, args, label);
  }
}));

commands.push(
  { name:"prefix", category:"settings", description:"Affiche le préfixe configuré", async execute(sock,msg,args,ctx){ return send(sock,ctx.sender,"⚙️ Préfixe actuel : " + config.prefix); } },
  { name:"botname", category:"settings", description:"Change le nom affiché du bot", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .botname NOXIS"); await settings.set("global","botname",v.slice(0,60)); return send(sock,ctx.sender,"🤖 Nom : "+v.slice(0,60)); } },
  { name:"ownername", category:"settings", description:"Change le nom affiché du propriétaire", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .ownername Nom"); await settings.set("global","ownername",v.slice(0,80)); return send(sock,ctx.sender,"👑 Owner : "+v.slice(0,80)); } },
  { name:"ownernumber", category:"settings", description:"Enregistre le numéro propriétaire", async execute(sock,msg,args,ctx){ const v=String(args[0]||"").replace(/\D/g,""); if(v.length<6)return send(sock,ctx.sender,"⚙️ Numéro invalide."); await settings.set("global","ownernumber",v); return send(sock,ctx.sender,"👑 Numéro owner enregistré."); } },
  { name:"description", category:"settings", description:"Change la description du bot", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .description Texte"); await settings.set("global","description",v.slice(0,300)); return send(sock,ctx.sender,"📝 Description enregistrée."); } },
  { name:"stickername", category:"settings", description:"Change le watermark des stickers", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .stickername NOXIS"); await settings.set("global","stickername",v.slice(0,60)); return send(sock,ctx.sender,"🏷️ Sticker name : "+v.slice(0,60)); } },
  { name:"settings", category:"settings", description:"Affiche les réglages", async execute(sock,msg,args,ctx){ const s=settings.get(ctx.isGroup?ctx.sender:"global"); return send(sock,ctx.sender,"⚙️ NOXIS SETTINGS\n\nMode: "+s.mode+"\nBot: "+s.botname+"\nOwner: "+s.ownername+"\nWelcome: "+s.welcome+"\nGoodbye: "+s.goodbye+"\nAnti-link: "+s.antilink+"\nAnti-delete: "+s.antidelete+"\nAnti-edit: "+s.antiedit+"\nAuto-read: "+s.autoread+"\nAuto-react: "+s.autoreact+"\nAnti-call: "+s.anticall); } },
  { name:"setwelcome", category:"settings", description:"Définit le message de bienvenue", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .setwelcome Bienvenue @user !"); await settings.set(ctx.isGroup?ctx.sender:"global","welcomeText",v.slice(0,500)); return send(sock,ctx.sender,"👋 Message de bienvenue enregistré."); } },
  { name:"setgoodbye", category:"settings", description:"Définit le message de départ", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .setgoodbye Au revoir @user !"); await settings.set(ctx.isGroup?ctx.sender:"global","goodbyeText",v.slice(0,500)); return send(sock,ctx.sender,"👋 Message de départ enregistré."); } },
  { name:"anticallmsg", category:"settings", description:"Change le message anti-appel", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .anticallmsg Texte"); await settings.set("global","anticallmsg",v.slice(0,500)); return send(sock,ctx.sender,"📵 Message anti-appel enregistré."); } },
  { name:"reactemojis", category:"settings", description:"Configure les emojis de réaction", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .reactemojis ⚡❤️🔥"); await settings.set("global","reactemojis",v.slice(0,100)); return send(sock,ctx.sender,"😀 Emojis enregistrés."); } },
  { name:"owneremojis", category:"settings", description:"Configure les emojis owner", async execute(sock,msg,args,ctx){ const v=args.join(" ").trim(); if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .owneremojis 👑"); await settings.set("global","owneremojis",v.slice(0,50)); return send(sock,ctx.sender,"👑 Emojis owner enregistrés."); } },
  { name:"editpath", category:"settings", description:"Configure le fichier anti-edit", async execute(sock,msg,args,ctx){ const v=args[0]; if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .editpath ./data/edits.json"); await settings.set("global","editpath",v); return send(sock,ctx.sender,"📝 Edit path enregistré."); } },
  { name:"delpath", category:"settings", description:"Configure le fichier anti-delete", async execute(sock,msg,args,ctx){ const v=args[0]; if(!v)return send(sock,ctx.sender,"⚙️ Utilisation : .delpath ./data/deleted.json"); await settings.set("global","delpath",v); return send(sock,ctx.sender,"🗑️ Delete path enregistré."); } },
  { name:"adminaction", category:"settings", description:"Active les notifications d'actions admin", async execute(sock,msg,args,ctx){ return setBool(sock,ctx,"adminaction",args,"Admin action"); } }
);

module.exports = commands;