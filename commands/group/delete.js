module.exports = {
  name: 'delete',
  aliases: ['del', 'd'],
  description: 'Supprimer un message cité',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '⚠️ La commande .delete est prévue pour les groupes.'
      });
    }

    const sender = msg.key.participant || jid;
    const senderNum = String(sender).split('@')[0].replace(/\D/g, '');

    try {
      const metadata = await sock.groupMetadata(jid);
      const participant = metadata.participants.find((p) =>
        String(p.id).split('@')[0].replace(/\D/g, '') === senderNum
      );
      const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

      if (!isAdmin && !msg.key.fromMe) {
        return sock.sendMessage(jid, {
          text: '❌ Seuls les administrateurs peuvent utiliser .delete.'
        });
      }
    } catch (error) {
      return sock.sendMessage(jid, {
        text: '❌ Impossible de vérifier les droits administrateur.'
      });
    }

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const stanzaId = context?.stanzaId;

    if (!stanzaId) {
      return sock.sendMessage(jid, {
        text: '⚠️ Réponds au message à supprimer avec .delete'
      });
    }

    try {
      await sock.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          fromMe: false,
          id: stanzaId,
          participant: context.participant
        }
      });

      // Supprime aussi la commande .delete elle-même.
      await sock.sendMessage(jid, { delete: msg.key });
    } catch (error) {
      console.error('Delete command error:', error);
      return sock.sendMessage(jid, {
        text: '❌ Impossible de supprimer ce message. Vérifie que le bot est administrateur du groupe.'
      });
    }
  }
};
