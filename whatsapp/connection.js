const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const config = require("../config");
const messageHandler = require("./handler");
const fs = require("fs-extra");

let sock = null;
let reconnectTimer = null;
let starting = false;

const logger = pino({ level: "silent" });

async function getCurrentWhatsAppVersion() {
  try {
    const response = await fetch("https://web.whatsapp.com/sw.js", {
      headers: {
        "sec-fetch-site": "none",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`WhatsApp Web version request failed: ${response.status}`);
    }

    const data = await response.text();
    const match = data.match(/\\?"client_revision\\?":\s*(\d+)/);

    if (!match) {
      throw new Error("client_revision not found in WhatsApp Web");
    }

    const version = [2, 3000, Number(match[1])];
    console.log(`🌐 WhatsApp Web version: ${version.join(".")}`);
    return version;
  } catch (error) {
    console.log(`⚠️ Impossible de récupérer la version WhatsApp Web: ${error.message}`);
    return undefined;
  }
}

async function startWhatsApp() {
  if (starting) return sock;
  starting = true;

  try {
    fs.ensureDirSync(config.sessionsPath);

    const { state, saveCreds } = await useMultiFileAuthState(
      config.sessionsPath
    );

    const version = await getCurrentWhatsAppVersion();

    const socketOptions = {
      auth: state,
      printQRInTerminal: true,
      browser: Browsers.ubuntu("NOXIS-MD"),
      logger,
      syncFullHistory: false
    };

    if (version) {
      socketOptions.version = version;
    }

    sock = makeWASocket(socketOptions);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📸 QR Code disponible : scanne-le avec WhatsApp.");
      }

      if (connection === "open") {
        starting = false;
        console.log("✅ WhatsApp connecté avec succès.");

        if (sock?.user) {
          console.log(`📱 Connecté comme : ${sock.user.name || sock.user.id}`);
        }
        return;
      }

      if (connection === "close") {
        starting = false;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(
          `⚠️ Connexion WhatsApp fermée (code: ${statusCode ?? "inconnu"}).`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(
            "❌ Session WhatsApp déconnectée. Nouvelle association nécessaire."
          );
          sock = null;
          return;
        }

        if (reconnectTimer) return;

        console.log("🔄 Nouvelle tentative dans 5 secondes...");
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          startWhatsApp().catch((error) => {
            console.error("WhatsApp restart error:", error);
          });
        }, 5000);
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          try {
            await messageHandler(sock, msg);
          } catch (error) {
            console.error("Message handler error:", error);
          }
        }
      }
    });

    sock.ev.on("groups.update", (updates) => {
      console.log("📢 Group update received:", updates);
    });

    sock.ev.on("presence.update", () => {});

    starting = false;
    return sock;
  } catch (error) {
    starting = false;
    console.error("❌ WhatsApp connection error:", error);

    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startWhatsApp().catch((err) => {
          console.error("WhatsApp restart error:", err);
        });
      }, 5000);
    }

    throw error;
  }
}

function getSocket() {
  return sock;
}

module.exports = { startWhatsApp, getSocket };
