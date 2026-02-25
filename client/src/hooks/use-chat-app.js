import { useState, useCallback } from "react";

export function useChatApp() {
  const [appState, setAppState] = useState("landing");
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isTextOnly, setIsTextOnly] = useState(false);
  const [interests, setInterests] = useState("");
  const [onlineCount] = useState(Math.floor(Math.random() * 5000) + 12000);

  const startMatching = useCallback(() => {
    setAppState("matching");
    setMessages([]);
    setTimeout(() => {
      setAppState("connected");
      setMessages([{
        id: "system-1",
        text: "You are now connected with a stranger. Say hi!",
        sender: "stranger",
        timestamp: new Date(),
      }]);
    }, 2000 + Math.random() * 3000);
  }, []);

  const sendMessage = useCallback((text) => {
    const newMsg = {
      id: Date.now().toString(),
      text,
      sender: "me",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);

    setIsPartnerTyping(true);
    setTimeout(() => {
      setIsPartnerTyping(false);
      const replies = [
        "Hey! How's it going?",
        "Nice to meet you!",
        "Where are you from?",
        "That's interesting!",
        "Cool, tell me more!",
        "Haha, that's funny",
        "What do you do for fun?",
      ];
      const reply = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "stranger",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500 + Math.random() * 2000);
  }, []);

  const skipPartner = useCallback(() => {
    setAppState("matching");
    setMessages([]);
    setIsPartnerTyping(false);
    setTimeout(() => {
      setAppState("connected");
      setMessages([{
        id: "system-1",
        text: "You are now connected with a new stranger. Say hi!",
        sender: "stranger",
        timestamp: new Date(),
      }]);
    }, 1500 + Math.random() * 2000);
  }, []);

  const disconnect = useCallback(() => {
    setAppState("landing");
    setMessages([]);
    setIsPartnerTyping(false);
  }, []);

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
    skipPartner,
    disconnect,
  };
}
