import { motion } from "framer-motion";
import {
  Mic, MicOff, Camera, CameraOff, SkipForward, PhoneOff, Flag,
} from "lucide-react";

export default function ControlBar({
  isMuted,
  setIsMuted,
  isCameraOff,
  setIsCameraOff,
  isTextOnly,
  onSkip,
  onDisconnect,
}) {
  const Btn = ({ onClick, active, danger, children, label }) => (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      className={`rounded-full p-3 transition-colors ${
        danger
          ? "bg-destructive text-destructive-foreground"
          : active
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-border">
      {!isTextOnly && (
        <>
          <Btn
            onClick={() => setIsMuted(!isMuted)}
            active={isMuted}
            label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Btn>
          <Btn
            onClick={() => setIsCameraOff(!isCameraOff)}
            active={isCameraOff}
            label={isCameraOff ? "Turn on camera" : "Turn off camera"}
          >
            {isCameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          </Btn>
        </>
      )}

      <Btn onClick={onSkip} label="Next partner">
        <SkipForward className="h-5 w-5" />
      </Btn>

      <Btn onClick={onDisconnect} danger label="Disconnect">
        <PhoneOff className="h-5 w-5" />
      </Btn>

      <Btn onClick={() => alert("User reported. Thank you.")} label="Report user">
        <Flag className="h-5 w-5" />
      </Btn>
    </div>
  );
}
