const express = require("express");
const { startWhatsApp, getLatestQR, getSocket, isWhatsAppRegistered, requestWhatsAppPairingCode } = require("./whatsapp/connection");
const { selectRoundRobin, checkAllServers, getStatus: getServerStatus } = require("./lib/serverSelector");

const port = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: "10kb" }));

let lastPairingRequestAt = 0;
let pairingCodeVisibleUntil = 0;

app.get("/", (req, res) => {
  res.status(200).send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOXIS-MD — Connexion WhatsApp</title>
<style>
body{font-family:Arial,sans-serif;background:#0b0b0f;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box}
.card{max-width:430px;width:100%;background:#15151c;border:1px solid #2b2b35;border-radius:18px;padding:24px;box-sizing:border-box;text-align:center}
h1{margin-top:0}.muted{color:#aaa;line-height:1.5}input,button{width:100%;padding:14px;border-radius:10px;box-sizing:border-box;font-size:16px}input{background:#0d0d12;color:#fff;border:1px solid #3a3a45;margin:12px 0}button{border:0;cursor:pointer;background:#fff;color:#111;font-weight:700}button:disabled{opacity:.5;cursor:not-allowed}
#result{margin-top:18px;min-height:28px}.code{font-size:30px;letter-spacing:5px;font-weight:800;margin:14px 0}.note{font-size:13px;color:#999;margin-top:14px}
a{color:#fff}
</style></head>
<body><main class="card">
<h1>🤖 NOXIS-MD</h1>
<h2>Connecter WhatsApp</h2>
<p class="muted">Entre ton numéro WhatsApp au format international. Aucun mot de passe, PIN ou code SMS ne doit être saisi ici.</p>
<input id="phone" inputmode="numeric" autocomplete="tel" placeholder="Ex. 24206XXXXXXX">
<button id="btn" onclick="pair()">Obtenir le code d'appairage</button>
<div id="result"></div>
<p class="note">Le code est destiné à l'appairage WhatsApp de cette instance NOXIS-MD. Ne partage jamais un code reçu par SMS ou ton PIN WhatsApp.</p>
</main>
<script>
async function pair(){
 const btn=document.getElementById('btn'), phone=document.getElementById('phone').value.trim(), out=document.getElementById('result');
 btn.disabled=true; out.textContent='⏳ Génération du code…';
 try{
  const r=await fetch('/api/pairing-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  const data=await r.json();
  if(!r.ok) throw new Error(data.error||'Impossible de générer le code.');
  out.innerHTML='<div>Voici ton code d’appairage :</div><div class="code">'+data.code+'</div><div>Dans WhatsApp : Appareils connectés → Connecter un appareil → Connecter avec un numéro de téléphone.</div>';
 }catch(e){out.textContent='❌ '+e.message;}
 finally{btn.disabled=false;}
}
</script></body></html>`);
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

app.get("/servers/status", (req, res) => {
  res.status(200).json({
    ok: true,
    strategy: "round-robin",
    serverId: process.env.NOXIS_SERVER_ID || "primary",
    servers: getServerStatus()
  });
});

app.get("/servers", (req, res) => {
  const selected = selectRoundRobin();
  res.status(200).json({
    ok: true,
    strategy: "round-robin",
    selectedServer: selected ? selected.id : null,
    servers: getServerStatus()
  });
});

app.post("/servers/select", (req, res) => {
  const selected = selectRoundRobin();
  if (!selected) {
    return res.status(503).json({ ok: false, error: "Aucun serveur configuré." });
  }
  return res.json({ ok: true, strategy: "round-robin", selectedServer: selected.id });
});

app.get("/health", (req, res) => {
  const { image } = getLatestQR();
  res.status(200).json({
    ok: true,
    whatsapp: !!getSocket(),
    whatsappRegistered: isWhatsAppRegistered(),
    qrAvailable: !!image,
    pairingPage: true,
    pairingCodeActive: Date.now() < pairingCodeVisibleUntil,
    whatsappEnabled: process.env.WHATSAPP_ENABLED !== "false"
  });
});

const healthIntervalMs = Math.max(10000, Number(process.env.SERVER_HEALTHCHECK_INTERVAL_MS || 30000));
setTimeout(() => {
  checkAllServers().catch((error) => console.error("❌ Round-robin health check error:", error));
}, 2000);
setInterval(() => {
  checkAllServers().catch((error) => console.error("❌ Round-robin health check error:", error));
}, healthIntervalMs);

app.listen(port, "0.0.0.0", () => {
  console.log("🌐 NOXIS-MD web server on port " + port);
});

if (process.env.WHATSAPP_ENABLED !== "false") {
  startWhatsApp().catch((error) => console.error("❌ WhatsApp startup error:", error));
} else {
  console.log("⏸️ WhatsApp disabled on this Render service (WHATSAPP_ENABLED=false).");
}
