import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getRsvps = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db
      .query("eventRsvps")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const getChecklist = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db
      .query("eventChecklist")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const setRsvp = mutation({
  args: {
    channelId: v.id("channels"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("not_going")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    const existing = await ctx.db
      .query("eventRsvps")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("eventRsvps", {
        channelId: args.channelId,
        userId: user._id,
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const addChecklistItem = mutation({
  args: {
    channelId: v.id("channels"),
    item: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db.insert("eventChecklist", {
      channelId: args.channelId,
      item: args.item,
      isCompleted: false,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const claimChecklistItem = mutation({
  args: { itemId: v.id("eventChecklist") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Checklist item not found");

    const channel = await ctx.db.get(item.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    await ctx.db.patch(args.itemId, {
      assignedTo: user._id,
    });
  },
});

export const toggleChecklistItem = mutation({
  args: { itemId: v.id("eventChecklist") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Checklist item not found");

    const channel = await ctx.db.get(item.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    await ctx.db.patch(args.itemId, {
      isCompleted: !item.isCompleted,
    });
  },
});

export const archivePastEvents = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Query all non-archived event channels
    const eventChannels = await ctx.db
      .query("channels")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "event"),
          q.eq(q.field("isArchived"), false),
          q.neq(q.field("eventDate"), undefined)
        )
      )
      .collect();

    for (const channel of eventChannels) {
      const endTime =
        channel.eventEndDate ?? (channel.eventDate! + 24 * 60 * 60 * 1000);
      if (now > endTime) {
        await ctx.db.patch(channel._id, {
          isArchived: true,
          archivedAt: now,
        });
      }
    }
  },
});
