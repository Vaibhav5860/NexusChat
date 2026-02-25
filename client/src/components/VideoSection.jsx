import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Camera, CameraOff, User } from "lucide-react";

export default function VideoSection({ isTextOnly, isMuted, isCameraOff, localStreamRef }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  // Listen for local stream from useChatApp
  useEffect(() => {
    const handleLocalStream = (e) => {
      const stream = e.detail;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    window.addEventListener("local-stream", handleLocalStream);

    // If stream already exists (was acquired before mount), attach it
    if (localStreamRef?.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    return () => window.removeEventListener("local-stream", handleLocalStream);
  }, [localStreamRef]);

  // Listen for remote stream from WebRTC
  useEffect(() => {
    const handleRemoteStream = (e) => {
      const stream = e.detail;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setHasRemoteStream(!!stream);
    };

    window.addEventListener("remote-stream", handleRemoteStream);
    return () => window.removeEventListener("remote-stream", handleRemoteStream);
  }, []);

  if (isTextOnly) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-2 w-full h-full min-h-0"
    >
      {/* Local video */}
      <div className="relative flex-1 rounded-xl overflow-hidden bg-muted border border-border">
        {isCameraOff ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <CameraOff className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Camera off</span>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover scale-x-[-1]"
          />
        )}
        <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-1 text-xs text-foreground flex items-center gap-1.5">
          <User className="h-3 w-3" /> You
          {isMuted && <MicOff className="h-3 w-3 text-destructive" />}
        </div>
      </div>

      {/* Remote video */}
      <div className="relative flex-1 rounded-xl overflow-hidden bg-muted border border-border">
        {hasRemoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Connecting...</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-1 text-xs text-foreground flex items-center gap-1.5">
          <User className="h-3 w-3" /> Stranger
        </div>
      </div>
    </motion.div>
  );
}
