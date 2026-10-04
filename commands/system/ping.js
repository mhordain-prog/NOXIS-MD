module.exports = {
  name: "ping",
  aliases: ["pong"],
  description: "Vérifier la réponse du bot",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const start = Date.now();

    try {
      await sock.sendMessage(jid, { text: "🏓 Pong !" });
      const latency = Date.now() - start;

      await sock.sendMessage(jid, {
        text: `⚡ NOXIS-MD\n📡 Latence : ${latency} ms`
      });
    } catch (error) {
      console.error("ping error:", error);
    }
  }
};