export interface GameScore {
  game: string;
  score: number;
  attempts?: number;
  date: string;
  rawText: string;
}

function countMistakes(text: string): number {
  const lines = text.split("\n").filter((l) => /[🟪🟦🟩🟨⬛]/.test(l));
  let mistakes = 0;
  for (const line of lines) {
    const emojis = [...line].filter((c) => /[🟪🟦🟩🟨⬛]/.test(c));
    // A line with mixed colors means a mistake row
    const uniqueColors = new Set(emojis);
    if (uniqueColors.size > 1) mistakes++;
  }
  return mistakes;
}

export function parseGameScore(text: string): GameScore | null {
  // Wordle: "Wordle 1,234 3/6" or "Wordle 1,234 X/6"
  const wordleMatch = text.match(/Wordle\s+([\d,]+)\s+([X\d])\/6/);
  if (wordleMatch) {
    return {
      game: "wordle",
      score: wordleMatch[2] === "X" ? 7 : parseInt(wordleMatch[2]!),
      attempts: wordleMatch[2] === "X" ? 7 : parseInt(wordleMatch[2]!),
      date: new Date().toISOString().split("T")[0]!,
      rawText: text,
    };
  }

  // Connections: "Connections Puzzle #123"
  const connectionsMatch = text.match(/Connections\s+Puzzle\s+#(\d+)/);
  if (connectionsMatch) {
    return {
      game: "connections",
      score: Math.max(0, 4 - countMistakes(text)),
      date: new Date().toISOString().split("T")[0]!,
      rawText: text,
    };
  }

  // Mini crossword: time-based
  const miniMatch = text.match(/Mini.*?(\d+):(\d+)/);
  if (miniMatch) {
    const seconds = parseInt(miniMatch[1]!) * 60 + parseInt(miniMatch[2]!);
    return {
      game: "mini",
      score: seconds,
      date: new Date().toISOString().split("T")[0]!,
      rawText: text,
    };
  }

  return null;
}
