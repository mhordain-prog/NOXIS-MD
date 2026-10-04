╔═══════════════════════════════════════════════════════════════╗
║             🤖 NOXIS-MD - WhatsApp Bot                      ║
║          Multi-Device WhatsApp Bot with AI                   ║
╚═══════════════════════════════════════════════════════════════╝

## 📋 Overview

**NOXIS-MD** is a WhatsApp bot built with **Baileys** for automation, group management, AI, media, downloader and utility features.

### 🎯 Key Features
- **Multi-Device Support**
- **Command System**
- **Group Management**
- **Owner Controls**
- **AI Features**
- **Media Processing**
- **Downloaders**
- **Easy Deployment**
- **Customizable**

---

## 🚀 Quick Start

### 1️⃣ Prerequisites
- **Node.js** v16 or higher
- **npm** or **yarn**
- **WhatsApp Account**

### 2️⃣ Installation

```bash
git clone https://github.com/mhordain-prog/NOXIS-MD.git
cd NOXIS-MD
npm install
cp .env.example .env
```

### 3️⃣ Configuration

Edit `.env` with your settings:

```env
OWNER_NUMBER=YOUR_WHATSAPP_NUMBER
BOT_NAME=NOXIS-MD
PREFIX=.
```

### 4️⃣ Run Bot

```bash
npm start
```

### 5️⃣ Connect WhatsApp

Scan the QR code with WhatsApp → **Appareils connectés** → **Connecter un appareil**.

---

## 📱 Usage

```
.menu    - Afficher le menu
.help    - Afficher l'aide
.ping    - Vérifier le statut du bot
.owner   - Informations du propriétaire
```

---

## 📁 Project Structure

```
NOXIS-MD/
├── index.js
├── config.js
├── package.json
├── .env.example
├── whatsapp/
├── telegram/
├── commands/
└── lib/
```

---

## 🌐 Deployment

NOXIS-MD peut être déployé sur un hébergement Node.js compatible, notamment Render.

### Render
1. Connecter le dépôt GitHub.
2. Configurer les variables d'environnement.
3. Utiliser la commande de démarrage adaptée au service.
4. Connecter WhatsApp avec le QR si nécessaire.

---

## ⚙️ Configuration Options

- `BOT_NAME` — nom du bot
- `PREFIX` — préfixe des commandes
- `OWNER_NUMBER` — numéro du propriétaire
- `BOT_MODE` — mode public, privé ou maintenance
- `AUTO_READ` — lecture automatique
- `AUTO_TYPING` — indicateur de saisie
- `AUTO_RECORD` — indicateur d'enregistrement

---

## 👨‍💻 Identity

**NOXIS-MD**
- Owner: Hordain Madila
- Bot type: WhatsApp Multi-Device

---

**Made for NOXIS-MD** 🖤
**Status:** 🟢 Active
