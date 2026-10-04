const fs = require("fs-extra");
const path = require("path");
const file = path.join(__dirname, "../../data/access.json");

function load(){ try{return fs.readJsonSync(file)}catch{return {sudo:[],ban:[]};} }
async function save(d){await fs.ensureFile(file);await fs.writeJson(file,d,{spaces:2});}
function jidFrom(args,msg){
  const c=msg.message?.extendedTextMessage?.contextInfo;
  if(c?.mentionedJid?.[0]) return c.mentionedJid[0];
  const n=String(args[0]||"").replace(/\D/g,"");
  return n.length>=6?n+"@s.whatsapp.net":null;
}
async function owner(sock,ctx){
  const owner=String(require("../../config").owner).replace(/\D/g,"");
  const sender=String(ctx.senderNumber||"").replace(/\D/g,"");
  if(sender!==owner){await sock.sendMessage(ctx.sender,{text:"❌ Réservé au propriétaire."});return false;}
  return true;
}
module.exports=[
 {name:"sudo",category:"settings",description:"Ajoute un sudo",async execute(sock,msg,args,ctx){
   if(!await owner(sock,ctx))return; const jid=jidFrom(args,msg); if(!jid)return sock.sendMessage(ctx.sender,{text:"❌ Mentionne un membre."});
   const d=load(); if(!d.sudo.includes(jid))d.sudo.push(jid); await save(d); return sock.sendMessage(ctx.sender,{text:"👑 Sudo ajouté.",mentions:[jid]});
 }},
 {name:"delsudo",aliases:["unsudo"],category:"settings",description:"Retire un sudo",async execute(sock,msg,args,ctx){
   if(!await owner(sock,ctx))return; const jid=jidFrom(args,msg); if(!jid)return sock.sendMessage(ctx.sender,{text:"❌ Mentionne un membre."});
   const d=load(); d.sudo=d.sudo.filter(x=>x!==jid); await save(d); return sock.sendMessage(ctx.sender,{text:"🗑️ Sudo retiré.",mentions:[jid]});
 }},
 {name:"listsudo",category:"settings",description:"Liste les sudo",async execute(sock,msg,args,ctx){
   const d=load(); if(!d.sudo.length)return sock.sendMessage(ctx.sender,{text:"👑 Aucun sudo."});
   return sock.sendMessage(ctx.sender,{text:"👑 SUDO\n\n"+d.sudo.map(x=>"• @"+x.split("@")[0]).join("\n"),mentions:d.sudo});
 }},
 {name:"ban",category:"settings",description:"Bloque un utilisateur du bot",async execute(sock,msg,args,ctx){
   if(!await owner(sock,ctx))return; const jid=jidFrom(args,msg); if(!jid)return sock.sendMessage(ctx.sender,{text:"❌ Mentionne un membre."});
   const d=load(); if(!d.ban.includes(jid))d.ban.push(jid); await save(d); return sock.sendMessage(ctx.sender,{text:"🚫 Utilisateur banni du bot.",mentions:[jid]});
 }},
 {name:"unban",category:"settings",description:"Débannit un utilisateur",async execute(sock,msg,args,ctx){
   if(!await owner(sock,ctx))return; const jid=jidFrom(args,msg); if(!jid)return sock.sendMessage(ctx.sender,{text:"❌ Mentionne un membre."});
   const d=load(); d.ban=d.ban.filter(x=>x!==jid); await save(d); return sock.sendMessage(ctx.sender,{text:"✅ Utilisateur débanni.",mentions:[jid]});
 }},
 {name:"banlist",aliases:["listban"],category:"settings",description:"Liste les bannis",async execute(sock,msg,args,ctx){
   const d=load(); if(!d.ban.length)return sock.sendMessage(ctx.sender,{text:"🚫 Aucun utilisateur banni."});
   return sock.sendMessage(ctx.sender,{text:"🚫 BANNIS\n\n"+d.ban.map(x=>"• @"+x.split("@")[0]).join("\n"),mentions:d.ban});
 }},
 {name:"botdp",category:"settings",description:"Change la photo du bot",async execute(sock,msg,args,ctx){
   if(!await owner(sock,ctx))return;
   const url=args[0];
   if(!url)return sock.sendMessage(ctx.sender,{text:"🖼️ Utilisation : .botdp URL_IMAGE"});
   try{await sock.updateProfilePicture(sock.user.id,{url});return sock.sendMessage(ctx.sender,{text:"🖼️ Photo du bot mise à jour."});}
   catch(e){return sock.sendMessage(ctx.sender,{text:"❌ Impossible de changer la photo : "+e.message});}
 }}
];