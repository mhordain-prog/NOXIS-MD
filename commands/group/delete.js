module.exports = {
  name: 'delete',
  aliases: ['del', 'd'],
  description: 'Supprimer un message cité',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.stanzaId
      ? {
          stanzaId: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant,
          remoteJid: jid
        }
      : null;

    if (!quoted) {
      return sock.sendMessage(jid, {
        text: '⚠️ Réponds au message à supprimer avec .delete'
      });
    }

    try {
      await sock.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          fromMe: false,
          id: quoted.stanzaId,
          participant: quoted.participant
        }
      });

      await sock.sendMessage(jid, { delete: msg.key });
    } catch (error) {
      console.error('Delete command error:', error);
      return sock.sendMessage(jid, {
        text: '❌ Impossible de supprimer ce message. Le bot doit avoir les droits nécessaires dans le groupe.'
      });
    }
  }
};
