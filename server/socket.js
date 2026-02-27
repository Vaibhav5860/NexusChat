const { Server } = require("socket.io");

// ─── State ───────────────────────────────────────────────────────
const waitingQueue = [];      // { socketId, interests[], isTextOnly }
const activeRooms = new Map(); // roomId -> { users: [socketId, socketId], isTextOnly }
const userRoom = new Map();    // socketId -> roomId

let io = null;

function getOnlineCount() {
  return io ? io.engine.clientsCount : 0;
}

function generateRoomId() {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Interest-based matching ─────────────────────────────────────
function findMatch(socket, interests, isTextOnly) {
  // Try to find someone with matching interests & same mode
  let bestIdx = -1;
  let bestScore = -1;

  for (let i = 0; i < waitingQueue.length; i++) {
    const candidate = waitingQueue[i];

    // Don't match with self
    if (candidate.socketId === socket.id) continue;

    // Must match text-only preference
    if (candidate.isTextOnly !== isTextOnly) continue;

    // Check if socket is still connected
    const candidateSocket = io.sockets.sockets.get(candidate.socketId);
    if (!candidateSocket) {
      waitingQueue.splice(i, 1);
      i--;
      continue;
    }

    // Score by shared interests
    const sharedInterests = interests.filter((int) =>
      candidate.interests.some(
        (ci) => ci.toLowerCase().trim() === int.toLowerCase().trim()
      )
    );
    const score = sharedInterests.length;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // If no interest match, take first compatible mode match
  if (bestIdx === -1) {
    for (let i = 0; i < waitingQueue.length; i++) {
      const candidate = waitingQueue[i];
      if (candidate.socketId === socket.id) continue;
      if (candidate.isTextOnly !== isTextOnly) continue;
      const candidateSocket = io.sockets.sockets.get(candidate.socketId);
      if (!candidateSocket) {
        waitingQueue.splice(i, 1);
        i--;
        continue;
      }
      bestIdx = i;
      break;
    }
  }

  if (bestIdx !== -1) {
    return waitingQueue.splice(bestIdx, 1)[0];
  }

  return null;
}

function createRoom(socketA, socketB, isTextOnly) {
  const roomId = generateRoomId();

  socketA.join(roomId);
  socketB.join(roomId);

  activeRooms.set(roomId, {
    users: [socketA.id, socketB.id],
    isTextOnly,
  });
  userRoom.set(socketA.id, roomId);
  userRoom.set(socketB.id, roomId);

  // Notify both users they are matched
  socketA.emit("matched", {
    roomId,
    isTextOnly,
    isInitiator: true, // This user creates the WebRTC offer
  });
  socketB.emit("matched", {
    roomId,
    isTextOnly,
    isInitiator: false,
  });

  console.log(`Room ${roomId} created: ${socketA.id} <-> ${socketB.id} (textOnly: ${isTextOnly})`);
}

function leaveRoom(socket) {
  const roomId = userRoom.get(socket.id);
  if (!roomId) return;

  const room = activeRooms.get(roomId);
  if (room) {
    // Notify partner
    const partnerId = room.users.find((id) => id !== socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit("partner-disconnected");
        userRoom.delete(partnerId);
        partnerSocket.leave(roomId);
      }
    }
    activeRooms.delete(roomId);
  }

  userRoom.delete(socket.id);
  socket.leave(roomId);
}

function removeFromQueue(socketId) {
  const idx = waitingQueue.findIndex((w) => w.socketId === socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

// ─── Socket.IO Init ─────────────────────────────────────────────
function initSocket(server) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:8080")
    .split(",")
    .map((o) => o.trim());

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Broadcast online count every 5 seconds
  setInterval(() => {
    io.emit("online-count", getOnlineCount());
  }, 5000);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send initial online count
    socket.emit("online-count", getOnlineCount());

    // ─── Matching ──────────────────────────────────────────
    socket.on("start-matching", ({ interests = [], isTextOnly = false }) => {
      // Clean up any existing room
      leaveRoom(socket);
      removeFromQueue(socket.id);

      const parsedInterests = typeof interests === "string"
        ? interests.split(",").map((s) => s.trim()).filter(Boolean)
        : interests;

      const match = findMatch(socket, parsedInterests, isTextOnly);

      if (match) {
        const partnerSocket = io.sockets.sockets.get(match.socketId);
        if (partnerSocket) {
          createRoom(socket, partnerSocket, isTextOnly);
        } else {
          // Partner disconnected, add self to queue
          waitingQueue.push({ socketId: socket.id, interests: parsedInterests, isTextOnly });
          socket.emit("waiting");
        }
      } else {
        // No match found, add to queue
        waitingQueue.push({ socketId: socket.id, interests: parsedInterests, isTextOnly });
        socket.emit("waiting");
      }
    });

    // ─── Chat Messages ─────────────────────────────────────
    socket.on("send-message", ({ text }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("receive-message", {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text,
            sender: "stranger",
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // ─── Typing Indicator ──────────────────────────────────
    socket.on("typing", () => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partner-typing");
        }
      }
    });

    socket.on("stop-typing", () => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partner-stop-typing");
        }
      }
    });

    // ─── Media State Signaling ──────────────────────────────
    socket.on("toggle-mute", ({ isMuted }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partner-muted", { isMuted });
        }
      }
    });

    socket.on("toggle-camera", ({ isCameraOff }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partner-camera-off", { isCameraOff });
        }
      }
    });

    // ─── WebRTC Signaling ──────────────────────────────────
    socket.on("webrtc-offer", ({ offer }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("webrtc-offer", { offer });
        }
      }
    });

    socket.on("webrtc-answer", ({ answer }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("webrtc-answer", { answer });
        }
      }
    });

    socket.on("webrtc-ice-candidate", ({ candidate }) => {
      const roomId = userRoom.get(socket.id);
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const partnerId = room.users.find((id) => id !== socket.id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("webrtc-ice-candidate", { candidate });
        }
      }
    });

    // ─── Skip / Disconnect ─────────────────────────────────
    socket.on("skip", () => {
      leaveRoom(socket);
      // Client will call start-matching again
    });

    socket.on("disconnect-chat", () => {
      leaveRoom(socket);
      removeFromQueue(socket.id);
    });

    // ─── Socket Disconnect ─────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      leaveRoom(socket);
      removeFromQueue(socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
