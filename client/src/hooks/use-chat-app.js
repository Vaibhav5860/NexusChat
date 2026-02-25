import { useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useChatApp() {
  const [appState, setAppState] = useState("landing");
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isTextOnly, setIsTextOnly] = useState(false);
  const [interests, setInterests] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const isTextOnlyRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isTextOnlyRef.current = isTextOnly;
  }, [isTextOnly]);

  // ─── WebRTC Helpers ────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      window.dispatchEvent(
        new CustomEvent("local-stream", { detail: stream })
      );
      return stream;
    } catch (err) {
      console.error("Failed to get local stream:", err);
      return null;
    }
  }, []);

  const cleanupWebRTC = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    window.dispatchEvent(new CustomEvent("remote-stream", { detail: null }));
    window.dispatchEvent(new CustomEvent("local-stream", { detail: null }));
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track");
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        window.dispatchEvent(
          new CustomEvent("remote-stream", { detail: event.streams[0] })
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    peerRef.current = pc;
    return pc;
  }, []);

  const startWebRTC = useCallback(async () => {
    const stream = await getLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("webrtc-offer", { offer });
    console.log("Sent WebRTC offer");
  }, [getLocalStream, createPeerConnection]);

  const handleOffer = useCallback(
    async (offer) => {
      const stream = await getLocalStream();
      if (!stream) return;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("webrtc-answer", { answer });
      console.log("Sent WebRTC answer");
    },
    [getLocalStream, createPeerConnection]
  );

  // ─── Initialize Socket ─────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("online-count", (count) => {
      setOnlineCount(count);
    });

    socket.on("waiting", () => {
      setAppState("matching");
    });

    socket.on("matched", ({ roomId, isTextOnly: textOnly, isInitiator }) => {
      console.log(`Matched in room ${roomId}, initiator: ${isInitiator}`);
      isInitiatorRef.current = isInitiator;
      setAppState("connected");
      setMessages([
        {
          id: "system-1",
          text: "You are now connected with a stranger. Say hi!",
          sender: "system",
          timestamp: new Date(),
        },
      ]);

      if (!textOnly && isInitiator) {
        setTimeout(() => startWebRTC(), 500);
      }
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, timestamp: new Date(msg.timestamp) },
      ]);
    });

    socket.on("partner-typing", () => {
      setIsPartnerTyping(true);
    });

    socket.on("partner-stop-typing", () => {
      setIsPartnerTyping(false);
    });

    socket.on("partner-disconnected", () => {
      cleanupWebRTC();
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          text: "Stranger has disconnected.",
          sender: "system",
          timestamp: new Date(),
        },
      ]);
      setIsPartnerTyping(false);
      setAppState("disconnected");
    });

    socket.on("webrtc-offer", async ({ offer }) => {
      console.log("Received WebRTC offer");
      await handleOffer(offer);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("Received WebRTC answer");
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      cleanupWebRTC();
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mute / Camera Toggle ─────────────────────────────
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);

  // ─── Actions ───────────────────────────────────────────
  const startMatching = useCallback(() => {
    setAppState("matching");
    setMessages([]);
    setIsPartnerTyping(false);
    cleanupWebRTC();

    socketRef.current?.emit("start-matching", {
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isTextOnly,
    });
  }, [interests, isTextOnly, cleanupWebRTC]);

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      text,
      sender: "me",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    socketRef.current?.emit("send-message", { text });

    socketRef.current?.emit("stop-typing");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const emitTyping = useCallback(() => {
    socketRef.current?.emit("typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop-typing");
      typingTimeoutRef.current = null;
    }, 2000);
  }, []);

  const skipPartner = useCallback(() => {
    cleanupWebRTC();
    socketRef.current?.emit("skip");
    setMessages([]);
    setIsPartnerTyping(false);
    setAppState("matching");

    socketRef.current?.emit("start-matching", {
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isTextOnly: isTextOnlyRef.current,
    });
  }, [interests, cleanupWebRTC]);

  const disconnect = useCallback(() => {
    cleanupWebRTC();
    socketRef.current?.emit("disconnect-chat");
    setAppState("landing");
    setMessages([]);
    setIsPartnerTyping(false);
  }, [cleanupWebRTC]);

  return {
    appState,
    messages,
    isPartnerTyping,
    isMuted,
    setIsMuted,
    isCameraOff,
    setIsCameraOff,
    isTextOnly,
    setIsTextOnly,
    interests,
    setInterests,
    onlineCount,
    startMatching,
    sendMessage,
    emitTyping,
    skipPartner,
    disconnect,
    localStreamRef,
    remoteStreamRef,
  };
}
