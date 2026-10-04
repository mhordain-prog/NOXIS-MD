module.exports = {
  name: "count",
  aliases: ["compte"],
  description: "Compter jusqu'à une valeur raisonnable",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const n = Math.min(Math.max(Number.parseInt(args[0], 10) || 10, 1), 50);
    return sock.sendMessage(jid, { text: '🔢 ' + Array.from({length:n}, (_,i)=>i+1).join(' • ') });
  }
};