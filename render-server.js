const http = require("http");
const { startWhatsApp, getLatestQR, getSocket } = require("./whatsapp/connection");

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];

  if (path === "/qr") {
    const { image } = getLatestQR();
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    if (image) {
      res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOXIS-MD QR</title></head><body style="font-family:sans-serif;text-align:center"><h2>NOXIS-MD — QR WhatsApp</h2><p>Scanne ce QR avec WhatsApp.</p><img src="${image}" width="320" height="320"><p>Si le QR expire, actualise la page.</p></body></html>`);
    } else {
      res.end("<h2>QR WhatsApp en préparation...</h2><p>Actualise cette page dans quelques secondes.</p>");
    }
    return;
  }

  if (path === "/health") {
    const { image } = getLatestQR();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      whatsapp: !!getSocket(),
      qrAvailable: !!image,
      whatsappEnabled: process.env.WHATSAPP_ENABLED !== "false"
    }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("NOXIS-MD is running\n\nQR: /qr\n");
});

server.listen(port, "0.0.0.0", () => {
  console.log("🌐 NOXIS-MD web server on port " + port);
});

if (process.env.WHATSAPP_ENABLED !== "false") {
  startWhatsApp().catch((error) => {
    console.error("❌ WhatsApp startup error:", error);
  });
} else {
  console.log("⏸️ WhatsApp disabled on this Render service (WHATSAPP_ENABLED=false).");
}
