import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      { e: "\u{1F600}", k: "grinning happy smile" },
      { e: "\u{1F604}", k: "smile happy laugh" },
      { e: "\u{1F601}", k: "grin beam" },
      { e: "\u{1F602}", k: "laugh cry tears joy" },
      { e: "\u{1F923}", k: "rofl rolling" },
      { e: "\u{1F60A}", k: "blush smile" },
      { e: "\u{1F607}", k: "angel innocent" },
      { e: "\u{1F970}", k: "love hearts" },
      { e: "\u{1F60D}", k: "heart eyes love" },
      { e: "\u{1F929}", k: "star struck excited" },
      { e: "\u{1F618}", k: "kiss blow" },
      { e: "\u{1F60B}", k: "yummy delicious" },
      { e: "\u{1F61C}", k: "wink tongue playful" },
      { e: "\u{1F914}", k: "thinking hmm" },
      { e: "\u{1F928}", k: "raised eyebrow" },
      { e: "\u{1F60F}", k: "smirk" },
      { e: "\u{1F644}", k: "eye roll" },
      { e: "\u{1F62C}", k: "grimace awkward" },
      { e: "\u{1F614}", k: "sad pensive" },
      { e: "\u{1F622}", k: "cry sad tear" },
      { e: "\u{1F62D}", k: "sob crying" },
      { e: "\u{1F631}", k: "scream shock" },
      { e: "\u{1F624}", k: "angry huff" },
      { e: "\u{1F621}", k: "angry mad" },
      { e: "\u{1F97A}", k: "pleading puppy" },
      { e: "\u{1F634}", k: "sleep tired" },
      { e: "\u{1F92F}", k: "mind blown" },
      { e: "\u{1F973}", k: "party celebrate" },
      { e: "\u{1F60E}", k: "cool sunglasses" },
      { e: "\u{1F913}", k: "nerd glasses" },
    ],
  },
  {
    name: "Gestures",
    emojis: [
      { e: "\u{1F44D}", k: "thumbs up like yes" },
      { e: "\u{1F44E}", k: "thumbs down dislike no" },
      { e: "\u{1F44F}", k: "clap applause" },
      { e: "\u{1F64C}", k: "raised hands celebrate" },
      { e: "\u{1F91D}", k: "handshake deal" },
      { e: "\u{1F64F}", k: "pray please thanks" },
      { e: "\u{1F4AA}", k: "muscle strong flex" },
      { e: "\u270C\uFE0F", k: "peace victory" },
      { e: "\u{1F91E}", k: "crossed fingers luck" },
      { e: "\u{1F44B}", k: "wave hello bye" },
      { e: "\u{1F440}", k: "eyes look see" },
      { e: "\u{1FAE1}", k: "salute" },
      { e: "\u{1FAF6}", k: "heart hands" },
    ],
  },
  {
    name: "Hearts",
    emojis: [
      { e: "\u2764\uFE0F", k: "red heart love" },
      { e: "\u{1F9E1}", k: "orange heart" },
      { e: "\u{1F49B}", k: "yellow heart" },
      { e: "\u{1F49A}", k: "green heart" },
      { e: "\u{1F499}", k: "blue heart" },
      { e: "\u{1F49C}", k: "purple heart" },
      { e: "\u{1F5A4}", k: "black heart" },
      { e: "\u{1F494}", k: "broken heart" },
      { e: "\u{1F495}", k: "hearts love" },
    ],
  },
  {
    name: "Symbols",
    emojis: [
      { e: "\u{1F525}", k: "fire hot lit" },
      { e: "\u{1F4AF}", k: "hundred perfect" },
      { e: "\u2728", k: "sparkles magic" },
      { e: "\u2B50", k: "star" },
      { e: "\u{1F389}", k: "party tada" },
      { e: "\u{1F480}", k: "skull dead" },
      { e: "\u{1F47B}", k: "ghost spooky" },
      { e: "\u{1F3C6}", k: "trophy winner" },
      { e: "\u{1F3AF}", k: "target bullseye" },
      { e: "\u{1F4A1}", k: "lightbulb idea" },
      { e: "\u{1F4CC}", k: "pin" },
      { e: "\u2705", k: "check done" },
      { e: "\u274C", k: "cross no wrong" },
      { e: "\u{1F680}", k: "rocket launch" },
      { e: "\u{1F4A4}", k: "sleep zzz" },
    ],
  },
  {
    name: "Food & Drink",
    emojis: [
      { e: "\u{1F355}", k: "pizza" },
      { e: "\u{1F354}", k: "burger" },
      { e: "\u{1F32E}", k: "taco" },
      { e: "\u{1F363}", k: "sushi" },
      { e: "\u{1F37A}", k: "beer" },
      { e: "\u2615", k: "coffee" },
      { e: "\u{1F9CB}", k: "boba tea" },
      { e: "\u{1F382}", k: "cake birthday" },
    ],
  },
  {
    name: "Activities",
    emojis: [
      { e: "\u26BD", k: "soccer football" },
      { e: "\u{1F3C0}", k: "basketball" },
      { e: "\u{1F3AE}", k: "game controller" },
      { e: "\u{1F3B5}", k: "music note" },
      { e: "\u{1F3AC}", k: "movie film" },
      { e: "\u{1F4F8}", k: "camera photo" },
      { e: "\u{1F5F3}\uFE0F", k: "ballot vote" },
      { e: "\u{1F4C5}", k: "calendar date" },
    ],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOwn?: boolean;
}

export function ReactionPicker({ onSelect, onClose, anchorRef, isOwn }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const pickerWidth = 288;
      const pickerApproxHeight = 340;

      let top =
        rect.top > pickerApproxHeight + 8
          ? rect.top - pickerApproxHeight - 8
          : rect.bottom + 8;

      let left = isOwn ? rect.right - pickerWidth : rect.left;

      if (left < 8) left = 8;
      if (left + pickerWidth > window.innerWidth - 8)
        left = window.innerWidth - pickerWidth - 8;
      if (top < 8) top = 8;

      setPosition({ top, left });
    }
  }, [anchorRef, isOwn]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const query = search.toLowerCase().trim();

  const filtered = query
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter(
          (em) => em.e.includes(query) || em.k.includes(query)
        ),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  const totalResults = filtered.reduce(
    (sum, cat) => sum + cat.emojis.length,
    0
  );

  if (!position) return null;

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", top: position.top, left: position.left }}
      className="z-50 w-72 rounded-xl border border-border bg-bg-elevated shadow-2xl"
    >
      <div className="border-b border-border p-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          autoFocus
          className="w-full rounded-lg bg-bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {totalResults === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            No emoji found
          </p>
        ) : (
          filtered.map((cat) => (
            <div key={cat.name} className="mb-2 last:mb-0">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                {cat.name}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((em) => (
                  <button
                    key={em.e}
                    onClick={() => onSelect(em.e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-bg-surface"
                  >
                    {em.e}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>,
    document.body
  );
}
