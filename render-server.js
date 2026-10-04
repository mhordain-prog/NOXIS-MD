const express = require("express");
const { startWhatsApp, getLatestQR, getSocket, isWhatsAppRegistered, requestWhatsAppPairingCode } = require("./whatsapp/connection");
const { selectRoundRobin, selectById, getSelectedServer, checkAllServers, getStatus: getServerStatus } = require("./lib/serverSelector");
const { getConfigPreview: getReferralConfig } = require("./lib/referralStore");

const port = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: "10kb" }));

let lastPairingRequestAt = 0;
let pairingCodeVisibleUntil = 0;

app.get("/", (req, res) => {
  const ref = String(req.query.ref || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  res.status(200).send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOXIS-MD — Bot WhatsApp</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#07070a;color:#f7f7fa}
body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 20% 0%,#24242f 0,transparent 35%),radial-gradient(circle at 85% 20%,#171722 0,transparent 30%);pointer-events:none}
.wrap{position:relative;max-width:1050px;margin:auto;padding:28px 18px 60px}.nav{display:flex;align-items:center;justify-content:space-between;padding:8px 0 45px}.brand{font-weight:900;letter-spacing:2px}.brand span{opacity:.5}.pill{border:1px solid #33343f;border-radius:999px;padding:9px 14px;color:#d9d9df;font-size:13px}
.hero{text-align:center;padding:35px 0 28px}.badge{display:inline-block;border:1px solid #30313b;background:#101017;border-radius:999px;padding:8px 13px;font-size:13px;color:#cfcfd6}.hero h1{font-size:clamp(42px,9vw,82px);line-height:.95;margin:22px 0 16px;letter-spacing:-4px}.hero p{max-width:650px;margin:0 auto;color:#aaaab5;line-height:1.65;font-size:17px}
.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:28px 0}.btn{display:inline-block;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:800;border:1px solid #363741;color:#fff;background:#fff;color:#09090c}.btn.alt{background:#15151c;color:#fff}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:38px}.card{background:rgba(18,18,25,.9);border:1px solid #292a34;border-radius:18px;padding:22px}.card h3{margin:0 0 8px}.card p{color:#999aa5;line-height:1.55;margin:0}.wide{grid-column:span 2}.ref{margin-top:14px;padding:18px;border-radius:16px;background:#101017;border:1px solid #292a34}.ref code{display:block;margin-top:8px;color:#fff;font-size:17px;word-break:break-all}.small{font-size:13px;color:#858691}
footer{text-align:center;color:#666773;margin-top:45px;font-size:13px}
@media(max-width:720px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.hero h1{letter-spacing:-2px}}
</style></head>
<body><main class="wrap">
<nav class="nav"><div class="brand">NOXIS<span>-MD</span></div><div class="pill">WhatsApp • Bot</div></nav>
<section class="hero">
<div class="badge">⚡ Automatisation • Groupes • IA • Médias</div>
<h1>NOXIS-MD</h1>
<p>Un espace simple pour découvrir le bot, suivre ton parrainage et connecter ton instance WhatsApp. Design original inspiré des interfaces modernes de bots, sans copier une identité propriétaire.</p>
<div class="actions">
<a class="btn" href="/qr">📷 Code QR WhatsApp</a>
<a class="btn alt" href="#parrainage">🤝 Parrainage</a><a class="btn alt" href="#serveurs">🛰️ Serveurs</a>
</div>
${ref ? '<div class="ref">🎟️ <b>Invitation détectée</b><div class="small">Code reçu depuis le lien de parrainage :</div><code>'+ref+'</code><div class="small">Tu peux utiliser ce code avec la commande .parrainage '+ref+'</div></div>' : ''}
</section>
<section class="grid">
<div class="card wide"><h3>🤖 Un bot complet</h3><p>Gestion de groupes, outils, IA, anime, médias, jeux, recherche et commandes système réunis dans une seule interface.</p></div>
<div class="card"><h3>🔒 Mode privé</h3><p>Cette instance est configurée en mode privé pour limiter l'utilisation aux personnes autorisées.</p></div>
<div class="card" id="parrainage"><h3>🤝 Parrainage</h3><p>Session <b id="refSession">chargement…</b> • plage <b id="refRange">chargement…</b></p><div class="small">Exemples : <span id="refSamples">—</span></div></div>
<div class="card" id="serveurs"><h3>🛰️ Sélection du serveur</h3><p>Choisis le serveur cible de l’interface. La sélection ne partage jamais la session WhatsApp entre serveurs.</p><select id="serverSelect" style="margin-top:12px;width:100%;padding:12px;border-radius:10px;background:#0b0b10;color:#fff;border:1px solid #363741"><option>Chargement…</option></select><button id="serverBtn" class="btn alt" style="margin-top:10px;width:100%;cursor:pointer">Sélectionner</button><div id="serverMsg" class="small" style="margin-top:8px"></div></div><div class="card"><h3>📱 Connexion</h3><p>Utilise le QR ou l'appairage prévu par NOXIS-MD. Ne saisis jamais ton PIN ou un code reçu par SMS sur ce site.</p></div>
</section>
<footer>NOXIS-MD • Hordain Madila • Interface web officielle de cette instance</footer>
</main><script>(async()=>{try{const r=await fetch("/api/referral/config");const d=await r.json();document.getElementById("refSession").textContent=d.session;document.getElementById("refRange").textContent=d.prefix+" "+d.start+" → "+d.end;document.getElementById("refSamples").textContent=d.sampleCodes.join(" • ")}catch(e){document.getElementById("refSession").textContent="indisponible"}try{const r=await fetch("/servers/status");const d=await r.json();const s=document.getElementById("serverSelect");s.innerHTML="";d.servers.filter(x=>x.enabled).forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.id.toUpperCase()+" — "+(x.healthy?"en ligne":"indisponible");s.appendChild(o)});if(d.selectedServer)s.value=d.selectedServer;document.getElementById("serverBtn").onclick=async()=>{const rr=await fetch("/servers/select",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({serverId:s.value})});const j=await rr.json();document.getElementById("serverMsg").textContent=j.ok?"✅ Serveur sélectionné : "+j.selectedServer:"❌ "+(j.error||"Sélection impossible")}}catch(e){document.getElementById("serverMsg").textContent="Serveurs indisponibles"}})();</script></body></html>`);
});

app.get("/qr", (req, res) => {
  const { image } = getLatestQR();
  res.status(200).send(image
    ? `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOXIS-MD QR</title></head><body style="font-family:sans-serif;text-align:center;padding:20px"><h2>NOXIS-MD — QR WhatsApp</h2><p>Scanne ce QR avec WhatsApp.</p><img src="${image}" width="320" height="320"><p>Si le QR expire, actualise la page.</p></body></html>`
    : '<h2>QR WhatsApp en préparation...</h2><p>Actualise cette page dans quelques secondes.</p>');
});

app.post("/api/pairing-code", async (req, res) => {
  const now = Date.now();
  if (now - lastPairingRequestAt < 60000) {
    return res.status(429).json({ error: "Attends une minute avant de demander un autre code." });
  }
  if (!getSocket()) return res.status(503).json({ error: "Le service WhatsApp n'est pas encore prêt. Réessaie dans quelques secondes." });
  if (isWhatsAppRegistered()) return res.status(409).json({ error: "NOXIS-MD est déjà connecté à un compte WhatsApp." });

  try {
    lastPairingRequestAt = now;
    const code = await requestWhatsAppPairingCode(req.body?.phone);
    pairingCodeVisibleUntil = Date.now() + 60000;
    return res.json({ ok: true, code, expiresInSeconds: 60 });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Impossible de générer le code." });
  }
});

app.get("/api/referral/config", (req, res) => res.json({ ok: true, ...getReferralConfig() }));

app.get("/servers/status", (req, res) => {
  const selected = getSelectedServer();
  res.status(200).json({ ok: true, strategy: "round-robin", serverId: process.env.NOXIS_SERVER_ID || "primary", selectedServer: selected ? selected.id : null, servers: getServerStatus() });
});
app.get("/servers", (req, res) => {
  const selected = selectRoundRobin();
  res.status(200).json({ ok: true, strategy: "round-robin", selectedServer: selected ? selected.id : null, servers: getServerStatus() });
});
app.post("/servers/select", (req, res) => {
  const requested = String(req.body?.serverId || "").trim();
  const selected = requested ? selectById(requested) : selectRoundRobin();
  if (!selected) return res.status(503).json({ ok: false, error: "Serveur indisponible ou non configuré." });
  return res.json({ ok: true, strategy: "round-robin", selectedServer: selected.id });
});
app.get("/health", (req, res) => {
  const { image } = getLatestQR();
  res.status(200).json({ ok: true, whatsapp: !!getSocket(), whatsappRegistered: isWhatsAppRegistered(), qrAvailable: !!image, pairingPage: true, pairingCodeActive: Date.now() < pairingCodeVisibleUntil, whatsappEnabled: process.env.WHATSAPP_ENABLED !== "false" });
});

const healthIntervalMs = Math.max(10000, Number(process.env.SERVER_HEALTHCHECK_INTERVAL_MS || 30000));
setTimeout(() => { checkAllServers().catch((error) => console.error("❌ Round-robin health check error:", error)); }, 2000);
setInterval(() => { checkAllServers().catch((error) => console.error("❌ Round-robin health check error:", error)); }, healthIntervalMs);

app.listen(port, "0.0.0.0", () => console.log("🌐 NOXIS-MD web server on port " + port));
if (process.env.WHATSAPP_ENABLED !== "false") startWhatsApp().catch((error) => console.error("❌ WhatsApp startup error:", error));
else console.log("⏸️ WhatsApp disabled on this Render service (WHATSAPP_ENABLED=false).");
