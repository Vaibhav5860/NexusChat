import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function MatchingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Spinner */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-2 border-border" />
          <div className="absolute inset-0 h-20 w-20 rounded-full border-2 border-transparent border-t-primary animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Finding your match
          </h2>
          <p className="text-muted-foreground">
            Waiting for a partner…
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
