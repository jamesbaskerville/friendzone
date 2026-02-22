import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { buildSenpaiPrompt } from "./lib/senpaiPrompt";

export const getRelevantMemories = internalQuery({
  args: {
    groupId: v.id("groups"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("senpaiMemory")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(args.limit);
  },
});

export const getGroupInfo = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    return group;
  },
});

export const getHangoutChannel = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const hangout = await ctx.db
      .query("channels")
      .withIndex("by_group_type", (q) =>
        q.eq("groupId", args.groupId).eq("type", "hangout")
      )
      .first();

    if (!hangout) throw new Error("Hangout channel not found");
    return hangout;
  },
});

function evaluateFrequency(
  frequency: "quiet" | "normal" | "chatty",
  triggerType: string
): boolean {
  // Quiet: only inactivity nudges and milestones
  if (frequency === "quiet") {
    return ["inactivity_nudge", "milestone"].includes(triggerType);
  }

  // Normal: adds throwbacks and suggestions
  if (frequency === "normal") {
    return [
      "inactivity_nudge",
      "milestone",
      "throwback",
      "suggestion",
      "we_should",
    ].includes(triggerType);
  }

  // Chatty: everything
  return true;
}

function formatMessages(
  messages: Array<{ body: string; authorId: string }>
): string {
  return messages.map((m) => `[${m.authorId}]: ${m.body}`).join("\n");
}

export const evaluateAndRespond = internalAction({
  args: {
    groupId: v.id("groups"),
    triggerMessageId: v.optional(v.id("messages")),
    triggerType: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.runQuery(internal.senpai.getGroupInfo, {
      groupId: args.groupId,
    });
    if (!group.senpaiEnabled) return;

    // Build context from recent messages and memories
    const recentMessages = await ctx.runQuery(
      internal.messages.getRecentForSenpai,
      { groupId: args.groupId, limit: 50 }
    );
    const memories = await ctx.runQuery(
      internal.senpai.getRelevantMemories,
      { groupId: args.groupId, limit: 20 }
    );
    const hallOfFame = await ctx.runQuery(
      internal.hallOfFame.getByGroupInternal,
      { groupId: args.groupId, limit: 10 }
    );

    // Determine if Senpai should respond (based on frequency)
    const shouldRespond = evaluateFrequency(
      group.senpaiFrequency,
      args.triggerType
    );
    if (!shouldRespond) return;

    // Build the prompt
    const systemPrompt = buildSenpaiPrompt({
      groupName: group.name,
      personality: group.senpaiPersonality,
      memories,
      hallOfFame,
      triggerType: args.triggerType,
    });

    // Call AI API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Recent chat:\n${formatMessages(recentMessages)}\n\nTrigger: ${args.triggerType}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const senpaiMessage = data.content[0].text;

    // Post the message to the hangout channel
    const hangoutChannel = await ctx.runQuery(
      internal.senpai.getHangoutChannel,
      { groupId: args.groupId }
    );

    await ctx.runMutation(internal.messages.postSenpaiMessage, {
      channelId: hangoutChannel._id,
      body: senpaiMessage,
      senpaiTrigger: args.triggerType,
    });
  },
});

export const storeMemory = internalMutation({
  args: {
    groupId: v.id("groups"),
    memoryType: v.union(
      v.literal("inside_joke"),
      v.literal("running_bit"),
      v.literal("preference"),
      v.literal("milestone")
    ),
    content: v.string(),
    sourceMessageIds: v.optional(v.array(v.id("messages"))),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("senpaiMemory", {
      groupId: args.groupId,
      memoryType: args.memoryType,
      content: args.content,
      sourceMessageIds: args.sourceMessageIds,
      createdAt: Date.now(),
      relevanceScore: 1.0,
    });
  },
});
