import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Reply, X } from "lucide-react";

// ── Emoji data ──────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: "😊 Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫠", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "🥱", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥸", "😎", "🤓", "🧐"],
  },
  {
    label: "👋 Gestures",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "🤟", "🤘", "🤙", "💪", "🦾", "🙏", "🤲", "👐", "🫶", "❤️‍🔥", "🫂", "🤜", "🤛"],
  },
  {
    label: "❤️ Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "❤️‍🔥", "❤️‍🩹"],
  },
  {
    label: "🎉 Celebration",
    emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🥳", "🎂", "🍰", "🧁", "🥂", "🍾", "🎆", "🎇", "✨", "🌟", "⭐", "🌠", "🎯", "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "🎗️"],
  },
  {
    label: "🐶 Animals",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🦊", "🦝", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐆", "🐅", "🦓", "🦍"],
  },
  {
    label: "🍕 Food",
    emojis: ["🍕", "🍔", "🌮", "🌯", "🥗", "🍜", "🍣", "🍱", "🍛", "🍚", "🍞", "🥐", "🧆", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🥪", "🥙", "🧀", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍷", "🍸", "🍹", "🍺", "🧃", "🥤", "☕", "🍵", "🧋", "🥛", "🍼"],
  },
  {
    label: "⚽ Sports",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "🎯", "⛳", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🏒", "🏑", "🥍", "🏏", "🎮", "🕹️", "🎲", "♟️", "🎭", "🎨", "🎬", "🎤", "🎸", "🎹", "🎺", "🎻", "🥁", "🎷"],
  },
  {
    label: "🌍 Travel",
    emojis: ["🌍", "🌎", "🌏", "🗺️", "🧭", "🏔️", "⛰️", "🌋", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🌅", "🌄", "🌠", "🎇", "🎆", "🌇", "🌆", "🏙️", "🌃", "🌉", "🌌", "🌁", "🚀", "🛸", "🌙", "⭐", "🌟", "✨", "⛅", "🌤️", "🌧️", "⛈️", "🌩️", "❄️", "🌈", "🌊", "🌀", "🌪️"],
  },
];

// ── EmojiPicker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
      className="absolute bottom-full mb-2 right-0 z-50 w-72 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
    >
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-border bg-muted/40">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            title={cat.label}
            className={`flex-shrink-0 text-base px-2 py-1 rounded-lg transition-all ${activeCategory === i
              ? "bg-primary/20 ring-1 ring-primary/40 scale-110"
              : "hover:bg-muted"
              }`}
          >
            {cat.emojis[0]}
          </button>
        ))}
      </div>
      <div className="px-3 pt-2 pb-1">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">
          {EMOJI_CATEGORIES[activeCategory].label}
        </span>
      </div>
      <div className="grid grid-cols-8 gap-0.5 px-2 pb-2 max-h-40 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(emoji)}
            className="text-xl p-1 rounded-lg hover:bg-muted transition-colors leading-none"
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── ReplyQuote — quoted snippet shown inside a message bubble ────────────────
function ReplyQuote({ replyTo, isMe }) {
  return (
    <div
      className={`mb-1.5 px-2 py-1 rounded-lg text-[11px] border-l-2 leading-tight ${isMe
        ? "border-white/50 bg-white/10 text-primary-foreground/80"
        : "border-primary/60 bg-primary/10 text-foreground/70"
        }`}
    >
      <span className="font-semibold block mb-0.5 opacity-80">
        {replyTo.sender === "me" ? "You" : "Stranger"}
      </span>
      <span className="line-clamp-2 break-words">{replyTo.text}</span>
    </div>
  );
}

// ── ChatPanel ────────────────────────────────────────────────────────────────
export default function ChatPanel({ messages, isPartnerTyping, onSendMessage, onTyping }) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);   // { id, text, sender }
  const [hoveredId, setHoveredId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text, replyTo);
    setInput("");
    setReplyTo(null);
  };

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReply = (msg) => {
    setReplyTo({ id: msg.id, text: msg.text, sender: msg.sender });
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender === "me";
            const isSystem = msg.sender === "system";

            /* system message */
            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            /* regular message */
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Reply btn — RIGHT side (my message, shown before bubble on left) */}
                {isMe && (
                  <button
                    onClick={() => handleReply(msg)}
                    title="Reply"
                    className="flex-shrink-0 mb-4 p-1.5 rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                    }`}
                >
                  {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} isMe={isMe} />}
                  <p className="break-words">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>

                {/* Reply btn — LEFT side (stranger's message, shown after bubble on right) */}
                {!isMe && (
                  <button
                    onClick={() => handleReply(msg)}
                    title="Reply"
                    className="flex-shrink-0 mb-4 p-1.5 rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
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

      {/* ── Input area ── */}
      <div className="border-t border-border">

        {/* Reply preview bar */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 bg-muted/40 border-b border-border">
                <Reply className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
                  <p className="text-[11px] font-semibold text-primary mb-0.5">
                    {replyTo.sender === "me" ? "Replying to yourself" : "Replying to Stranger"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setReplyTo(null)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-3">
          <div className="relative flex gap-2 items-center">

            {/* Emoji picker popup */}
            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </AnimatePresence>

            {/* Emoji toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmoji((v) => !v)}
              className={`flex-shrink-0 rounded-lg p-2 transition-all ${showEmoji
                ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </motion.button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                onTyping?.();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={replyTo ? "Write a reply…" : "Type a message…"}
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
    </div>
  );
}
