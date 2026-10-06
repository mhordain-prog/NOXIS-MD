const groupProtection = require('../../lib/groupProtection');

module.exports = {
  name: 'antilink',
  aliases: ['nolink', 'linkguard'],
  category: 'security',
  description: 'Activer ou désactiver la suppression automatique des liens',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!jid?.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || jid;
    const senderMember = metadata.participants.find(p => p.id === sender);

    if (!senderMember?.admin) {
      return sock.sendMessage(jid, { text: '❌ Tu dois être administrateur.' });
    }

    const action = String(args[0] || '').toLowerCase();

    if (!['on', 'off', 'status'].includes(action)) {
      return sock.sendMessage(jid, {
        text: '🛡️ Utilisation : .antilink on | .antilink off | .antilink status'
      });
    }

    const current = groupProtection.get(jid);

    if (action === 'status') {
      return sock.sendMessage(jid, {
        text: current.antilink
          ? '◆━━━━━━━━━━━━━━◆\n   ꧁ 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂'
          : '◆━━━━━━━━━━━━━━◆\n   ꧁ 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂'
      });
    }

    const enabled = action === 'on';
    await groupProtection.set(jid, 'antilink', enabled);

    return sock.sendMessage(jid, {
      text: enabled
        ? '◆━━━━━━━━━━━━━━◆\n   ꧁ 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ✅ ᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂'
        : '◆━━━━━━━━━━━━━━◆\n   ꧁ 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 ꧂\n◆━━━━━━━━━━━━━━◆\n» sᴛᴀᴛᴜᴛ : ❌ ᴅᴇ́sᴀᴄᴛɪᴠᴇ́\n꧁━━━━━━━━━━━━━━꧂'
    });
  }
};
