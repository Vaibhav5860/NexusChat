import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Camera, CameraOff, User } from "lucide-react";

export default function VideoSection({ isTextOnly, isMuted, isCameraOff }) {
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (isTextOnly || isCameraOff) return;
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: !isMuted })
      .then((s) => {
        stream = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        // Permission denied, handled gracefully
      });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isTextOnly, isCameraOff, isMuted]);

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

      {/* Remote video (placeholder) */}
      <div className="relative flex-1 rounded-xl overflow-hidden bg-muted border border-border">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Stranger</span>
        </div>
        <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-1 text-xs text-foreground flex items-center gap-1.5">
          <User className="h-3 w-3" /> Stranger
          <Mic className="h-3 w-3 text-online" />
          <Camera className="h-3 w-3 text-online" />
        </div>
      </div>
    </motion.div>
  );
}
