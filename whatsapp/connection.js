const nodeCrypto = require("crypto");

// Baileys utilise Web Crypto via la variable globale `crypto`.
// Sur certaines images Node, elle n'est pas exposée automatiquement.
if (!globalThis.crypto && nodeCrypto.webcrypto) {
  globalThis.crypto = nodeCrypto.webcrypto;
}

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
const settings = require("../lib/settingsStore");
const fs = require("fs-extra");
const QRCode = require("qrcode");
const {
  usePostgresAuthState,
  clearPostgresAuthState
} = require("./postgresAuth");

let sock = null;
let reconnectTimer = null;
let starting = false;
let latestQR = null;
let latestQRImage = null;
let authPool = null;

// Petit cache runtime utilisé par anti-edit/anti-delete.
const messageCache = new Map();
const MAX_CACHE = 1000;

const logger = pino({ level: "silent" });

function rememberMessage(msg) {
  const key = msg?.key;
  if (!key?.id || !key?.remoteJid || !msg.message) return;
  messageCache.set(key.remoteJid + ":" + key.id, msg);
  if (messageCache.size > MAX_CACHE) {
    const first = messageCache.keys().next().value;
    if (first) messageCache.delete(first);
  }
}

function extractText(msg) {
  return msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    "";
}

function renderTemplate(template, user, group) {
  return String(template || "")
    .replace(/@user/g, "@" + String(user || "").split("@")[0])
    .replace(/@group/g, group || "ce groupe");
}

async function startWhatsApp() {
  if (starting) return sock;
  starting = true;

  try {
    let state;
    let saveCreds;
    const usePostgres = !!process.env.DATABASE_URL;

    if (usePostgres) {
      ({ state, saveCreds, pool: authPool } = await usePostgresAuthState(
        process.env.DATABASE_URL
      ));
    } else {
      fs.ensureDirSync(config.sessionsPath);
      ({ state, saveCreds } = await useMultiFileAuthState(config.sessionsPath));
      console.log("💾 WhatsApp session storage: local filesystem");
      console.log("⚠️ DATABASE_URL absent: Render may lose the session after restart.");
    }

    let version;
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest?.version) {
        version = latest.version;
        console.log("🌐 Baileys WhatsApp Web version: " + version.join("."));
      }
    } catch (error) {
      console.log("⚠️ Version WhatsApp non récupérée: " + error.message);
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
          latestQRImage = await QRCode.toDataURL(qr, { margin: 2, width: 320 });
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

        const globalSettings = settings.get("global");
        if (globalSettings.online) {
          try { await sock.sendPresenceUpdate("available"); } catch {}
        }

        console.log("✅ WhatsApp connecté avec succès.");
        if (sock?.user) console.log("📱 Connecté comme : " + (sock.user.name || sock.user.id));
        return;
      }

      if (connection === "close") {
        starting = false;

        const error = lastDisconnect?.error;
        const statusCode =
          error?.output?.statusCode ??
          error?.statusCode ??
          error?.data?.statusCode;

        console.log("⚠️ Connexion WhatsApp fermée (code: " + (statusCode ?? "inconnu") + ").");
        if (error?.message) console.log("ℹ️ Motif: " + error.message);

        sock = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("❌ Session WhatsApp invalide. Nettoyage de la session...");
          try {
            if (usePostgres) {
              await clearPostgresAuthState(authPool);
              authPool = null;
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
      if (m.type !== "notify") return;

      for (const msg of m.messages) {
        try {
          rememberMessage(msg);

          const jid = msg.key?.remoteJid;
          const globalSettings = settings.get("global");

          // Statuts : lecture automatique et réaction facultative.
          if (jid === "status@broadcast") {
            if (globalSettings.statusview) {
              try { await sock.readMessages([msg.key]); } catch {}
            }
            if (globalSettings.statuslike && !msg.key.fromMe) {
              const emoji = Array.from(globalSettings.reactemojis || "❤️")[0] || "❤️";
              try {
                await sock.sendMessage("status@broadcast", {
                  react: { text: emoji, key: msg.key }
                });
              } catch {}
            }
          }

          await messageHandler(sock, msg);
        } catch (error) {
          console.error("Message handler error:", error);
        }
      }
    });

    sock.ev.on("messages.update", async (updates) => {
      const globalSettings = settings.get("global");

      for (const item of updates || []) {
        const key = item?.key;
        if (!key?.remoteJid || !key?.id) continue;

        if (globalSettings.antiedit && item.update?.message?.editedMessage) {
          const old = messageCache.get(key.remoteJid + ":" + key.id);
          const oldText = extractText(old);
          if (oldText) {
            try {
              await sock.sendMessage(key.remoteJid, {
                text: "🛡️ ANTI-EDIT\nAncien message : " + oldText
              });
            } catch {}
          }
        }
      }
    });

    sock.ev.on("messages.delete", async (event) => {
      const globalSettings = settings.get("global");
      if (!globalSettings.antidelete) return;

      const keys = event?.keys || [];
      for (const key of keys) {
        const old = messageCache.get(key.remoteJid + ":" + key.id);
        const oldText = extractText(old);
        if (!oldText) continue;

        try {
          await sock.sendMessage(key.remoteJid, {
            text: "🛡️ ANTI-DELETE\nMessage supprimé : " + oldText
          });
        } catch {}
      }
    });

    async function sendMemberEventMessage(groupId, user, type, groupName, groupSettings) {
      const isWelcome = type === "welcome";
      const template = isWelcome ? groupSettings.welcomeText : groupSettings.goodbyeText;
      const caption = renderTemplate(template, user, groupName);

      try {
        const photoUrl = await sock.profilePictureUrl(user, "image");
        if (photoUrl) {
          const response = await require("axios").get(photoUrl, {
            responseType: "arraybuffer",
            timeout: 10000,
            maxContentLength: 5 * 1024 * 1024
          });
          return sock.sendMessage(groupId, {
            image: Buffer.from(response.data),
            caption,
            mentions: [user]
          });
        }
      } catch (photoError) {
        console.log("⚠️ Photo de profil indisponible pour " + user + ": " + photoError.message);
      }

      return sock.sendMessage(groupId, {
        text: caption,
        mentions: [user]
      });
    }

    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
      try {
        const groupSettings = settings.get(id);
        if (!groupSettings.welcome && !groupSettings.goodbye) return;

        const metadata = await sock.groupMetadata(id);
        const groupName = metadata?.subject || id;

        if (action === "add" && groupSettings.welcome) {
          for (const user of participants || []) {
            await sendMemberEventMessage(id, user, "welcome", groupName, groupSettings);
          }
        }

        if ((action === "remove" || action === "leave") && groupSettings.goodbye) {
          for (const user of participants || []) {
            await sendMemberEventMessage(id, user, "goodbye", groupName, groupSettings);
          }
        }
      } catch (error) {
        console.error("Welcome/goodbye error:", error.message);
      }
    });

    sock.ev.on("call", async (calls) => {
      const globalSettings = settings.get("global");
      if (!globalSettings.anticall) return;

      for (const call of calls || []) {
        const from = call.from;
        if (!from) continue;
        try {
          await sock.sendMessage(from, { text: globalSettings.anticallmsg });
        } catch {}
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
        startWhatsApp().catch((err) => console.error("WhatsApp restart error:", err.message));
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
