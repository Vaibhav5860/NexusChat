import { motion } from "framer-motion";
import { Video, MessageSquare, Shuffle, Shield, Zap } from "lucide-react";

export default function LandingScreen({
  onStart,
  interests,
  setInterests,
  isTextOnly,
  setIsTextOnly,
  onlineCount,
}) {
  const features = [
    { icon: Video, label: "HD Video", desc: "Crystal clear video calls" },
    { icon: MessageSquare, label: "Live Chat", desc: "Real-time messaging" },
    { icon: Shuffle, label: "Random Match", desc: "Meet new people instantly" },
    { icon: Shield, label: "Anonymous", desc: "No account required" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full"
      >
        {/* Logo + tagline + counter */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="h-10 w-10 text-primary" />
              <div className="absolute inset-0 animate-pulse-glow">
                <Zap className="h-10 w-10 text-primary blur-sm" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-gradient-primary">Nexus</span>
              <span className="text-muted-foreground font-light">OpenChat</span>
            </h1>
          </div>

          <p className="text-muted-foreground text-center text-lg">
            Meet strangers. Make connections. Stay anonymous.
          </p>

          {/* Online counter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{onlineCount.toLocaleString()}</span> people online now
            </span>
          </div>
        </div>

        {/* Options card */}
        <div className="w-full rounded-xl bg-card border border-border p-6 space-y-4">
          {/* Interest input */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Add interests (optional)
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="gaming, music, tech..."
              className="w-full rounded-lg bg-muted border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          {/* Text only toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-secondary-foreground">Text-only mode</span>
            <button
              onClick={() => setIsTextOnly(!isTextOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isTextOnly ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                  isTextOnly ? "translate-x-5" : ""
                }`}
              />
            </button>
          </label>

          {/* Start button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-lg glow-primary transition-shadow hover:shadow-lg"
          >
            Start Chatting
          </motion.button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {features.map((f) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 rounded-lg bg-card/50 border border-border/50 p-3"
            >
              <f.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
