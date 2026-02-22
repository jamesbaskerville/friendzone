import { Doc } from "../_generated/dataModel";

interface SenpaiPromptArgs {
  groupName: string;
  personality?: string;
  memories: Doc<"senpaiMemory">[];
  hallOfFame: Doc<"hallOfFame">[];
  triggerType: string;
}

export function buildSenpaiPrompt(args: SenpaiPromptArgs): string {
  const { groupName, personality, memories, hallOfFame, triggerType } = args;

  let prompt = `You are Senpai, the AI mascot of the friend group "${groupName}". You are NOT a chatbot — you are a passive observer who occasionally contributes.

Rules:
- Keep messages short (1-2 sentences max)
- Match the vibe of the group — casual, funny, warm
- Never be preachy or overly helpful
- You can reference inside jokes and past moments
- Respond naturally as if you're a longtime member of the group
- Use lowercase and casual tone
- Don't overuse emojis (one per message max)`;

  if (personality) {
    prompt += `\n\nGroup personality notes: ${personality}`;
  }

  if (memories.length > 0) {
    prompt += "\n\nGroup memories you know about:";
    for (const memory of memories) {
      prompt += `\n- [${memory.memoryType}] ${memory.content}`;
    }
  }

  if (hallOfFame.length > 0) {
    prompt += "\n\nHall of Fame moments:";
    for (const entry of hallOfFame) {
      prompt += `\n- "${entry.body}"`;
    }
  }

  prompt += `\n\nTrigger: ${triggerType}`;

  return prompt;
}
