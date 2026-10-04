const axios = require("axios");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "shorturl2",
    aliases: ["tinyurl", "shortlink"],
    category: "tools",
    description: "Raccourcit une URL publique",
    async execute(sock, msg, args, ctx) {
      const url = args[0];
      if (!/^https?:\/\//i.test(url || "")) return send(sock, ctx.sender, "🔗 Utilisation : .shorturl2 https://exemple.com");
      try {
        const r = await axios.get("https://tinyurl.com/api-create.php", { params: { url }, timeout: 10000 });
        return send(sock, ctx.sender, "🔗 URL courte : " + r.data);
      } catch {
        return send(sock, ctx.sender, "❌ Service de raccourcissement indisponible.");
      }
    }
  },
  {
    name: "urlcheck",
    aliases: ["checkurl", "urlstatus"],
    category: "tools",
    description: "Vérifie l'accessibilité d'une URL publique",
    async execute(sock, msg, args, ctx) {
      const url = args[0];
      if (!/^https?:\/\//i.test(url || "")) return send(sock, ctx.sender, "🔎 Utilisation : .urlcheck https://exemple.com");
      try {
        const r = await axios.head(url, { timeout: 10000, maxRedirects: 5, validateStatus: () => true });
        return send(sock, ctx.sender, "🔎 URL\n• Statut : " + r.status + "\n• Type : " + (r.headers["content-type"] || "inconnu"));
      } catch {
        return send(sock, ctx.sender, "❌ URL inaccessible ou serveur indisponible.");
      }
    }
  },
  {
    name: "ipinfo",
    aliases: ["ipcheck", "ip"],
    category: "internet",
    description: "Affiche des informations publiques sur une adresse IP",
    async execute(sock, msg, args, ctx) {
      const ip = args[0];
      if (!ip || !/^[0-9a-f:.]+$/i.test(ip)) return send(sock, ctx.sender, "🌐 Utilisation : .ipinfo 8.8.8.8");
      try {
        const r = await axios.get("https://ipwho.is/" + encodeURIComponent(ip), { timeout: 10000 });
        const d = r.data;
        if (!d.success) return send(sock, ctx.sender, "❌ IP introuvable.");
        return send(sock, ctx.sender,
          "🌐 IP INFO\n• IP : " + d.ip +
          "\n• Pays : " + (d.country || "N/A") +
          "\n• Ville : " + (d.city || "N/A") +
          "\n• Région : " + (d.region || "N/A") +
          "\n• FAI/ASN : " + (d.connection?.isp || d.connection?.asn || "N/A")
        );
      } catch {
        return send(sock, ctx.sender, "❌ Service IP indisponible.");
      }
    }
  }
];

module.exports = module.exports;