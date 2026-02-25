import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";

export const getByMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    const emojiMap = new Map<
      string,
      { emoji: string; count: number; userIds: string[] }
    >();

    for (const reaction of reactions) {
      const existing = emojiMap.get(reaction.emoji);
      if (existing) {
        existing.count += 1;
        existing.userIds.push(reaction.userId);
      } else {
        emojiMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          userIds: [reaction.userId],
        });
      }
    }

    return Array.from(emojiMap.values());
  },
});

export const add = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const existingReactions = await ctx.db
      .query("reactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .collect();

    const alreadyReacted = existingReactions.find(
      (r) => r.emoji === args.emoji
    );
    if (alreadyReacted) return;

    await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: Date.now(),
    });

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Instant action: pin
    if (args.emoji === "📌") {
      await ctx.db.insert("pins", {
        channelId: message.channelId,
        messageId: args.messageId,
        pinnedBy: user._id,
        pinnedAt: Date.now(),
      });
    }

    // Threshold actions
    const reactionsForEmoji = await ctx.db
      .query("reactions")
      .withIndex("by_message_emoji", (q) =>
        q.eq("messageId", args.messageId).eq("emoji", args.emoji)
      )
      .collect();

    const uniqueReactorIds = new Set(reactionsForEmoji.map((r) => r.userId));
    const uniqueCount = uniqueReactorIds.size;

    // 🏆 threshold unique reactors → Hall of Fame
    if (args.emoji === "🏆") {
      const channel = await ctx.db.get(message.channelId);
      if (channel) {
        const group = await ctx.db.get(channel.groupId);
        const threshold = group?.hallOfFameThreshold ?? 5;

        if (uniqueCount >= threshold) {
          const existingHof = await ctx.db
            .query("hallOfFame")
            .withIndex("by_group", (q) => q.eq("groupId", channel.groupId))
            .collect();

          const alreadyEnshrined = existingHof.find(
            (h) => h.messageId === args.messageId
          );

          if (!alreadyEnshrined) {
            await ctx.db.insert("hallOfFame", {
              groupId: channel.groupId,
              messageId: args.messageId,
              channelId: message.channelId,
              authorId: message.authorId,
              body: message.body,
              trophyCount: uniqueCount,
              enshrineDate: Date.now(),
            });
          }
        }
      }
    }
  },
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const userReactions = await ctx.db
      .query("reactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .collect();

    const reaction = userReactions.find((r) => r.emoji === args.emoji);
    if (reaction) {
      await ctx.db.delete(reaction._id);
    }
  },
});
