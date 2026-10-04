const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const config = require("../config");
const messageHandler = require("./handler");
const fs = require("fs-extra");
const QRCode = require("qrcode");
const {
  useMongoDBAuthState,
  clearMongoDBAuthState
} = require("./mongoAuth");

let sock = null;
let reconnectTimer = null;
let starting = false;
let latestQR = null;
let latestQRImage = null;

const logger = pino({ level: "silent" });

async function startWhatsApp() {
  if (starting) return sock;
  starting = true;

  try {
    let state;
    let saveCreds;
    const useMongo = !!process.env.MONGODB_URI;

    if (useMongo) {
      ({ state, saveCreds } = await useMongoDBAuthState(
        process.env.MONGODB_URI,
        process.env.MONGODB_DB || "noxis"
      ));
    } else {
      fs.ensureDirSync(config.sessionsPath);
      ({ state, saveCreds } = await useMultiFileAuthState(
        config.sessionsPath
      ));
      console.log("💾 WhatsApp session storage: local filesystem");
      console.log("⚠️ MONGODB_URI absent: Render may lose the session after restart.");
    }

    let version;
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest?.version) {
        version = latest.version;
        console.log(`🌐 Baileys WhatsApp Web version: ${version.join(".")}`);
      }
    } catch (error) {
      console.log(`⚠️ Version WhatsApp non récupérée: ${error.message}`);
    }

    const socketOptions = {
      auth: state,
      printQRInTerminal: true,
      browser: Browsers.ubuntu("NOXIS-MD"),
      logger,
      syncFullHistory: false,
      markOnlineOnConnect: false
    };

    if (version) socketOptions.version = version;

    sock = makeWASocket(socketOptions);
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        latestQR = qr;
        try {
          latestQRImage = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320
          });
          console.log("📸 QR Code disponible sur /qr.");
        } catch (error) {
          latestQRImage = null;
          console.error("❌ Impossible de générer l’image du QR:", error.message);
        }
      }

      if (connection === "open") {
        starting = false;
        latestQR = null;
        latestQRImage = null;
        console.log("✅ WhatsApp connecté avec succès.");

        if (sock?.user) {
          console.log(`📱 Connecté comme : ${sock.user.name || sock.user.id}`);
        }
        return;
      }

      if (connection === "close") {
        starting = false;

        const error = lastDisconnect?.error;
        const statusCode =
          error?.output?.statusCode ??
          error?.statusCode ??
          error?.data?.statusCode;

        console.log(
          `⚠️ Connexion WhatsApp fermée (code: ${statusCode ?? "inconnu"}).`
        );
        if (error?.message) console.log(`ℹ️ Motif: ${error.message}`);

        sock = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("❌ Session WhatsApp invalide. Nettoyage de la session...");

          try {
            if (useMongo) {
              await clearMongoDBAuthState();
            } else {
              await fs.emptyDir(config.sessionsPath);
            }
            console.log("🧹 Session nettoyée.");
          } catch (cleanupError) {
            console.error("❌ Impossible de nettoyer la session:", cleanupError.message);
          }

          latestQR = null;
          latestQRImage = null;
        }

        if (reconnectTimer) return;

        console.log("🔄 Nouvelle tentative dans 5 secondes...");
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          startWhatsApp().catch((restartError) => {
            console.error("WhatsApp restart error:", restartError.message);
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
          console.error("WhatsApp restart error:", err.message);
        });
      }, 5000);
    }

    throw error;
  }
}

function getSocket() {
  return sock;
}

function getLatestQR() {
  return { qr: latestQR, image: latestQRImage };
}

module.exports = { startWhatsApp, getSocket, getLatestQR };
