import { motion } from "framer-motion";
import { useChatApp } from "@/hooks/use-chat-app";
import LandingScreen from "@/components/LandingScreen";
import MatchingScreen from "@/components/MatchingScreen";
import VideoSection from "@/components/VideoSection";
import ChatPanel from "@/components/ChatPanel";
import ControlBar from "@/components/ControlBar";

export default function ChatRoom() {
  const {
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
  } = useChatApp();

  if (appState === "landing") {
    return (
      <LandingScreen
        onStart={startMatching}
        interests={interests}
        setInterests={setInterests}
        isTextOnly={isTextOnly}
        setIsTextOnly={setIsTextOnly}
        onlineCount={onlineCount}
      />
    );
  }

  if (appState === "matching") {
    return <MatchingScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
          <span className="text-sm font-medium text-foreground">Connected with stranger</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {onlineCount.toLocaleString()} online
        </span>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex min-h-0 ${isTextOnly ? "" : "flex-col lg:flex-row"}`}>
        {/* Video area */}
        {!isTextOnly && (
          <div className="lg:flex-1 h-[40vh] lg:h-auto p-2">
            <VideoSection
              isTextOnly={isTextOnly}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
            />
          </div>
        )}

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-h-0 border-l border-border ${isTextOnly ? "max-w-2xl mx-auto w-full border-l-0 border-x" : "lg:max-w-md"}`}>
          <ChatPanel
            messages={messages}
            isPartnerTyping={isPartnerTyping}
            onSendMessage={sendMessage}
          />
        </div>
      </div>

      {/* Controls */}
      <ControlBar
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isCameraOff={isCameraOff}
        setIsCameraOff={setIsCameraOff}
        isTextOnly={isTextOnly}
        onSkip={skipPartner}
        onDisconnect={disconnect}
      />
    </motion.div>
  );
}
