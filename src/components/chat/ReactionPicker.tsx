import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const EMOJIS = [
  "\u{1F44D}", "\u{1F44E}", "\u2764\uFE0F", "\u{1F602}", "\u{1F62E}", "\u{1F622}",
  "\u{1F525}", "\u{1F4AF}", "\u{1F480}", "\u{1F440}",
  "\u{1F4CC}", "\u{1F3C6}", "\u{1F9F5}", "\u{1F500}", "\u{1F4C5}",
  "\u{1F3B5}", "\u{1F5F3}\uFE0F", "\u{1F389}", "\u{1F64F}", "\u{1F60D}",
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute bottom-full left-0 z-30 mb-1 grid grid-cols-5 gap-1 rounded-xl border border-border bg-bg-elevated p-2 shadow-xl"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-bg-surface"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
