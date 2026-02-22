import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  assertGroupMember,
  assertGroupAdmin,
} from "./lib/permissions";

export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const typeOrder: Record<string, number> = {
      hangout: 0,
      event: 1,
      bracket: 2,
    };

    return channels.sort(
      (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
    );
  },
});

export const getById = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return channel;
  },
});

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    type: v.union(
      v.literal("hangout"),
      v.literal("event"),
      v.literal("bracket")
    ),
    eventDate: v.optional(v.number()),
    eventEndDate: v.optional(v.number()),
    eventLocation: v.optional(v.string()),
    bracketQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    const channelId = await ctx.db.insert("channels", {
      groupId: args.groupId,
      name: args.name,
      type: args.type,
      createdBy: user._id,
      createdAt: Date.now(),
      forkDepth: 0,
      isArchived: false,
      eventDate: args.eventDate,
      eventEndDate: args.eventEndDate,
      eventLocation: args.eventLocation,
      bracketQuestion: args.bracketQuestion,
      bracketStatus: args.type === "bracket" ? "nominating" : undefined,
    });

    return channelId;
  },
});

export const forkFromMessage = mutation({
  args: {
    messageId: v.id("messages"),
    channelType: v.union(
      v.literal("hangout"),
      v.literal("event"),
      v.literal("bracket")
    ),
    name: v.string(),
    eventDate: v.optional(v.number()),
    bracketQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const parentChannel = await ctx.db.get(message.channelId);
    if (!parentChannel) throw new Error("Parent channel not found");

    await assertGroupMember(ctx, parentChannel.groupId, user._id);

    const newChannelId = await ctx.db.insert("channels", {
      groupId: parentChannel.groupId,
      name: args.name,
      type: args.channelType,
      createdBy: user._id,
      createdAt: Date.now(),
      parentChannelId: parentChannel._id,
      parentMessageId: args.messageId,
      forkDepth: parentChannel.forkDepth + 1,
      isArchived: false,
      eventDate: args.eventDate,
      bracketQuestion: args.bracketQuestion,
      bracketStatus:
        args.channelType === "bracket" ? "nominating" : undefined,
    });

    await ctx.db.patch(args.messageId, {
      forkedToChannelId: newChannelId,
    });

    await ctx.db.insert("messages", {
      channelId: parentChannel._id,
      authorId: user._id,
      body: `Forked to #${args.name}`,
      createdAt: Date.now(),
      isDeleted: false,
      threadReplyCount: 0,
      messageType: "system",
    });

    return newChannelId;
  },
});

export const archive = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    await assertGroupAdmin(ctx, channel.groupId, user._id);

    await ctx.db.patch(args.channelId, {
      isArchived: true,
      archivedAt: Date.now(),
    });
  },
});
