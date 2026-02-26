import { useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Free TURN servers for NAT traversal (mobile/restrictive networks)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useChatApp() {
  const [appState, setAppState] = useState("landing");
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isPartnerMuted, setIsPartnerMuted] = useState(false);
  const [isPartnerCameraOff, setIsPartnerCameraOff] = useState(false);
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
  const iceCandidateQueue = useRef([]);

  // Keep ref in sync with state
  useEffect(() => {
    isTextOnlyRef.current = isTextOnly;
  }, [isTextOnly]);

  // ─── WebRTC Helpers ────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    // Try full video + audio first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      window.dispatchEvent(
        new CustomEvent("local-stream", { detail: stream })
      );
      return stream;
    } catch (err) {
      console.warn("Camera+audio failed, trying audio-only:", err.message);
    }

    // Fallback: audio only (camera denied)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      // Mark camera off since we only have audio
      setIsCameraOff(true);
      window.dispatchEvent(
        new CustomEvent("local-stream", { detail: stream })
      );
      return stream;
    } catch (err) {
      console.warn("Audio-only also failed:", err.message);
    }

    // All media denied — return null but still allow receive-only WebRTC
    console.warn("No media permissions granted — will be receive-only");
    setIsCameraOff(true);
    setIsMuted(true);
    return null;
  }, []);

  // Cleanup only the peer connection (keeps local stream alive for re-matching)
  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    remoteStreamRef.current = null;
    iceCandidateQueue.current = [];
    window.dispatchEvent(new CustomEvent("remote-stream", { detail: null }));
  }, []);

  // Full cleanup — also stops camera/mic (used when going back to landing)
  const cleanupAll = useCallback(() => {
    cleanupPeer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    window.dispatchEvent(new CustomEvent("local-stream", { detail: null }));
  }, [cleanupPeer]);

  const createPeerConnection = useCallback(() => {
    // Cleanup any existing connection first
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        window.dispatchEvent(
          new CustomEvent("remote-stream", { detail: event.streams[0] })
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
        console.log("WebRTC connected successfully!");
      }
      // Handle ICE failures gracefully — don't crash
      if (pc.iceConnectionState === "failed") {
        console.warn("ICE connection failed, attempting restart...");
        try {
          pc.restartIce();
        } catch (err) {
          console.error("ICE restart failed:", err);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "failed") {
        console.warn("Peer connection failed");
      }
    };

    peerRef.current = pc;
    return pc;
  }, []);

  // Process any buffered ICE candidates
  const flushIceCandidates = useCallback(async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) return;
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding buffered ICE candidate:", err);
      }
    }
  }, []);

  const startWebRTCRef = useRef(null);
  const handleOfferRef = useRef(null);

  startWebRTCRef.current = async () => {
    console.log("Starting WebRTC as initiator...");
    const stream = await getLocalStream();

    const pc = createPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log("Adding local track:", track.kind);
        pc.addTrack(track, stream);
      });
    } else {
      // No media — add a receive-only transceiver so we can still get partner's video/audio
      console.warn("No local stream — setting up receive-only");
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      // Tell partner our camera & mic are off
      socketRef.current?.emit("toggle-camera", { isCameraOff: true });
      socketRef.current?.emit("toggle-mute", { isMuted: true });
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("webrtc-offer", { offer: pc.localDescription });
    console.log("Sent WebRTC offer");
  };

  handleOfferRef.current = async (offer) => {
    console.log("Handling WebRTC offer as responder...");
    const stream = await getLocalStream();

    const pc = createPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log("Adding local track:", track.kind);
        pc.addTrack(track, stream);
      });
    } else {
      // No media — add receive-only transceivers so we can still get partner's video/audio
      console.warn("No local stream — setting up receive-only");
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      // Tell partner our camera & mic are off
      socketRef.current?.emit("toggle-camera", { isCameraOff: true });
      socketRef.current?.emit("toggle-mute", { isMuted: true });
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit("webrtc-answer", { answer: pc.localDescription });
    console.log("Sent WebRTC answer");

    // Flush any ICE candidates that arrived before remote description was set
    await flushIceCandidates();
  };

  // ─── Initialize Socket ─────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
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
      iceCandidateQueue.current = [];
      setAppState("connected");
      setMessages([
        {
          id: "system-1",
          text: "You are now connected with a stranger. Say hi!",
          sender: "system",
          timestamp: new Date(),
        },
      ]);
      // Reset partner media state for new match
      setIsPartnerMuted(false);
      setIsPartnerCameraOff(false);

      if (!textOnly && isInitiator) {
        // Short delay to let VideoSection mount
        setTimeout(() => {
          startWebRTCRef.current?.();
        }, 300);
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

    socket.on("partner-muted", ({ isMuted: muted }) => {
      setIsPartnerMuted(muted);
    });

    socket.on("partner-camera-off", ({ isCameraOff: camOff }) => {
      setIsPartnerCameraOff(camOff);
    });

    socket.on("partner-disconnected", () => {
      cleanupPeer();
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
      await handleOfferRef.current?.(offer);
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("Received WebRTC answer");
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        // Flush any buffered ICE candidates
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding buffered ICE candidate:", err);
          }
        }
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      if (!candidate) return;
      // Buffer if peer connection isn't ready or remote description not set
      if (!peerRef.current || !peerRef.current.remoteDescription) {
        console.log("Buffering ICE candidate");
        iceCandidateQueue.current.push(candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      // If the server kicked us (not client-initiated), we'll auto-reconnect
      if (reason === "io server disconnect") {
        socket.connect(); // force reconnect
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (err) => {
      console.warn("Reconnection error:", err.message);
    });

    return () => {
      cleanupAll();
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
    // Signal partner about mute state
    socketRef.current?.emit("toggle-mute", { isMuted });
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
    // Signal partner about camera state
    socketRef.current?.emit("toggle-camera", { isCameraOff });
  }, [isCameraOff]);

  // ─── Actions ───────────────────────────────────────────
  const startMatching = useCallback(async () => {
    setAppState("matching");
    setMessages([]);
    setIsPartnerTyping(false);
    cleanupPeer();

    // Pre-acquire camera/mic before matching so stream is ready for WebRTC
    if (!isTextOnly && !localStreamRef.current) {
      await getLocalStream();
    }

    socketRef.current?.emit("start-matching", {
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isTextOnly,
    });
  }, [interests, isTextOnly, cleanupPeer, getLocalStream]);

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
    cleanupPeer();
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
  }, [interests, cleanupPeer]);

  const disconnect = useCallback(() => {
    cleanupAll();
    socketRef.current?.emit("disconnect-chat");
    setAppState("landing");
    setMessages([]);
    setIsPartnerTyping(false);
  }, [cleanupAll]);

  return {
    appState,
    messages,
    isPartnerTyping,
    isMuted,
    setIsMuted,
    isCameraOff,
    setIsCameraOff,
    isPartnerMuted,
    isPartnerCameraOff,
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
