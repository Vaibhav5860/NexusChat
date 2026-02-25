# ⚡ NexusChat

Anonymous video & text chat — meet strangers instantly. No signup required.

![NexusChat](https://img.shields.io/badge/NexusChat-Live-00d4aa?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333?style=flat-square)

---

## Features

- **HD Video Calls** — Peer-to-peer WebRTC with STUN servers
- **Real-time Chat** — Instant messaging with typing indicators
- **Random Matching** — Interest-based pairing algorithm
- **Text-only Mode** — Chat without video
- **Fully Anonymous** — No accounts, no data stored
- **Report Issues** — Submit bugs directly to GitHub Issues or via email

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| Video | WebRTC (peer-to-peer) |
| Signaling | Socket.IO |
| Report API | GitHub Octokit, Nodemailer |
| Deploy | Vercel (client) + Render (server) |

## Project Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # useChatApp (Socket.IO + WebRTC)
│   │   ├── lib/            # Utilities
│   │   └── pages/          # Route pages
│   ├── vercel.json         # Vercel deploy config
│   └── .env.example
│
├── server/                 # Node.js backend
│   ├── index.js            # Express + HTTP server
│   ├── socket.js           # Socket.IO matching, chat & WebRTC signaling
│   ├── routes/
│   │   └── report.js       # GitHub Issues & email report API
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/Vaibhav5860/NexusChat.git
cd NexusChat
```

### 2. Setup the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` with your credentials:

```env
GITHUB_TOKEN=ghp_your_token        # GitHub PAT with "repo" scope
GITHUB_OWNER=Vaibhav5860
GITHUB_REPO=NexusChat
MAIL_SERVICE=gmail
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password         # Gmail App Password
REPORT_EMAIL=your_email@gmail.com
PORT=3001
CLIENT_URL=http://localhost:8080
```

Start the server:

```bash
npm run dev
```

### 3. Setup the client

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:3001
```

Start the client:

```bash
npm run dev
```

Open **http://localhost:8080** in two browser tabs and click "Start Chatting" to test.

## Deployment

### Server → Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect the GitHub repo
3. **Root Directory:** `server`
4. **Build Command:** `npm install`
5. **Start Command:** `node index.js`
6. Add environment variables from `server/.env.example`
7. Set `CLIENT_URL` to your Vercel URL (e.g. `https://nexuschat.vercel.app`)

### Client → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import the GitHub repo
3. **Root Directory:** `client`
4. **Framework Preset:** Vite
5. Add env var: `VITE_API_URL` = your Render URL (e.g. `https://nexuschat-server.onrender.com`)

> After both are deployed, update Render's `CLIENT_URL` to include the Vercel domain.

## How It Works

1. **User connects** → Socket.IO establishes a WebSocket connection
2. **Start matching** → Server queues the user, finds a partner by shared interests
3. **Matched** → Both users join a private room
4. **Chat** → Messages relayed through Socket.IO in real-time
5. **Video** → WebRTC peer connection established via signaling (offer/answer/ICE)
6. **Skip** → Room destroyed, user re-enters the queue

## License

MIT

---

Built by [Vaibhav](https://github.com/Vaibhav5860)
