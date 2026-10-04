const fs = require("fs-extra");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const send = (sock, to, text) => sock.sendMessage(to, { text });

function quoted(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

function mediaFrom(message) {
  if (!message) return null;
  if (message.imageMessage) return { type: "image", data: message.imageMessage };
  if (message.videoMessage) return { type: "video", data: message.videoMessage };
  if (message.audioMessage) return { type: "audio", data: message.audioMessage };
  if (message.documentMessage) return { type: "document", data: message.documentMessage };
  return null;
}

module.exports = [
  {
    name: "mediainfo",
    aliases: ["metamedia", "mediainfo"],
    category: "media",
    description: "Affiche les informations du média cité",
    async execute(sock, msg, args, ctx) {
      const q = quoted(msg);
      const media = mediaFrom(q);
      if (!media) return send(sock, ctx.sender, "🖼️ Réponds à une image, vidéo, audio ou document.");
      const d = media.data;
      return send(sock, ctx.sender,
        `📦 MÉDIA\n• Type: ${media.type}\n• MIME: ${d.mimetype || "inconnu"}\n• Nom: ${d.fileName || "sans nom"}\n• Taille: ${d.fileLength || "inconnue"}`
      );
    }
  },
  {
    name: "save",
    aliases: ["sauver", "enregistrer"],
    category: "media",
    description: "Enregistre un média public cité sur le serveur",
    async execute(sock, msg, args, ctx) {
      const q = quoted(msg);
      const media = mediaFrom(q);
      if (!media) return send(sock, ctx.sender, "💾 Réponds à un média pour l'enregistrer.");
      const folder = path.join(process.cwd(), "media-cache");
      await fs.ensureDir(folder);
      const ext = media.type === "image" ? "jpg" : media.type === "video" ? "mp4" : media.type === "audio" ? "mp3" : "bin";
      const filename = `noxis-${Date.now()}.${ext}`;
      const output = path.join(folder, filename);
      try {
        const stream = await downloadContentFromMessage(media.data, media.type);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        await fs.writeFile(output, Buffer.concat(chunks));
        return send(sock, ctx.sender, `💾 Média enregistré: ${filename}`);
      } catch (e) {
        return send(sock, ctx.sender, "❌ Impossible d'enregistrer ce média.");
      }
    }
  }
];
