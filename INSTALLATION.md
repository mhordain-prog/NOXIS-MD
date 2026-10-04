# 📦 Installation Guide - NOXIS-MD

Guide d'installation et de configuration de NOXIS-MD.

## 🎯 Prerequisites

- **Node.js** v16 ou supérieur
- **npm**
- **Git**
- **WhatsApp Account**

## 📥 Installation

### 1. Clone Repository

```bash
git clone https://github.com/mhordain-prog/NOXIS-MD.git
cd NOXIS-MD
npm install
cp .env.example .env
```

### 2. Configure Settings

```env
OWNER_NUMBER=YOUR_WHATSAPP_NUMBER
BOT_NAME=NOXIS-MD
PREFIX=.
BOT_MODE=public
AUTO_READ=true
AUTO_TYPING=true
AUTO_RECORD=true
```

### 3. Run

```bash
npm start
```

### 4. Connect WhatsApp

Ouvre WhatsApp → **Appareils connectés** → **Connecter un appareil**, puis scanne le QR affiché par NOXIS-MD.

## 🌐 Render

Le service Render peut utiliser la commande :

```bash
node render-server.js
```

Après le déploiement, ouvre la page QR du service si une nouvelle connexion WhatsApp est nécessaire.

## 🧪 Vérification

Teste :

```
.menu
.ping
```

## 🔧 Dépannage

### QR non disponible
Attends quelques secondes puis actualise la page QR.

### WhatsApp non connecté
Vérifie la connexion Internet et rescane le QR si la session a été perdue.

### Commande inconnue
Vérifie le préfixe `.` et utilise `.menu`.

## 🔐 Sécurité

Ne partage jamais tes secrets, tokens ou fichier `.env`.
