import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";
import { parseGameScore } from "./lib/gameParser";

export const getById = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const channel = await ctx.db.get(message.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return message;
  },
});

export const listByChannel = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    const results = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: results.page.filter((m) => m.threadParentId === undefined),
    };
  },
});

export const listThread = query({
  args: { parentMessageId: v.id("messages") },
  handler: async (ctx, args) => {
    const parentMessage = await ctx.db.get(args.parentMessageId);
    if (!parentMessage) throw new Error("Parent message not found");

    const channel = await ctx.db.get(parentMessage.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) =>
        q.eq("threadParentId", args.parentMessageId)
      )
      .order("asc")
      .collect();
  },
});

export const search = query({
  args: {
    channelId: v.id("channels"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withSearchIndex("search_body", (q) =>
        q.search("body", args.query).eq("channelId", args.channelId)
      )
      .collect();
  },
});

export const send = mutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
    threadParentId: v.optional(v.id("messages")),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    mediaTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    // Check for game score in body
    const gameScore = parseGameScore(args.body);

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      body: args.body,
      createdAt: Date.now(),
      isDeleted: false,
      threadParentId: args.threadParentId,
      threadReplyCount: 0,
      mediaStorageIds: args.mediaStorageIds,
      mediaTypes: args.mediaTypes,
      messageType: gameScore ? "game_score" : "text",
      gameData: gameScore ?? undefined,
    });

    // If this is a thread reply, update the parent message
    if (args.threadParentId) {
      const parent = await ctx.db.get(args.threadParentId);
      if (parent) {
        await ctx.db.patch(args.threadParentId, {
          threadReplyCount: parent.threadReplyCount + 1,
          threadLastReplyAt: Date.now(),
        });
      }
    }

    // If game score was detected, store it in gameScores table
    if (gameScore) {
      await ctx.db.insert("gameScores", {
        groupId: channel.groupId,
        userId: user._id,
        game: gameScore.game,
        date: gameScore.date,
        score: gameScore.score,
        attempts: gameScore.attempts,
        messageId,
        createdAt: Date.now(),
      });
    }

    return messageId;
  },
});

export const edit = mutation({
  args: {
    messageId: v.id("messages"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.authorId !== user._id)
      throw new Error("Can only edit your own messages");

    await ctx.db.patch(args.messageId, {
      body: args.body,
      editedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.authorId !== user._id)
      throw new Error("Can only delete your own messages");

    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});

export const postSenpaiMessage = internalMutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
    senpaiTrigger: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    return await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: channel.createdBy,
      body: args.body,
      createdAt: Date.now(),
      isDeleted: false,
      threadReplyCount: 0,
      messageType: "senpai",
      senpaiTrigger: args.senpaiTrigger,
    });
  },
});

export const getRecentForSenpai = internalQuery({
  args: {
    groupId: v.id("groups"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the hangout channel for this group
    const hangout = await ctx.db
      .query("channels")
      .withIndex("by_group_type", (q) =>
        q.eq("groupId", args.groupId).eq("type", "hangout")
      )
      .first();

    if (!hangout) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", hangout._id))
      .order("desc")
      .take(args.limit);

    return messages.reverse();
  },
});
