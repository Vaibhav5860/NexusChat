import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

export default function ChatPanel({ messages, isPartnerTyping, onSendMessage, onTyping, onReact }) {
  const [input, setInput] = useState("");
  const [openPicker, setOpenPicker] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
                {/* Reactions display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="mt-2 flex gap-2 items-center text-sm">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <div key={emoji} className="px-2 py-1 bg-black/5 rounded-full text-xs">
                        <span className="mr-1">{emoji}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Emoji picker trigger */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setOpenPicker(openPicker === msg.id ? null : msg.id)}
                    title="React"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    😊
                  </button>
                </div>

                {/* Inline emoji picker */}
                {openPicker === msg.id && (
                  <div className="mt-2 p-2 bg-popover border border-border rounded-lg flex gap-2 flex-wrap">
                    {['😀','😂','😍','👍','👎','🎉','😮','😢'].map((e) => (
                      <button
                        key={e}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => {
                          onReact?.(msg.id, e);
                          setOpenPicker(null);
                        }}
                        className="p-1 text-lg"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1 items-center text-sm text-muted-foreground pl-1"
          >
            <span>Stranger is typing</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block h-1 w-1 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onTyping?.();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message…"
            className="flex-1 rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-lg bg-primary text-primary-foreground p-2 disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
