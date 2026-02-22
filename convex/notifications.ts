import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";

export const getUnread = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .order("desc")
      .collect();
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== user._id)
      throw new Error("Not your notification");

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const sendMessageNotifications = internalMutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    messageBody: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) return;

    const group = await ctx.db.get(channel.groupId);
    if (!group) return;

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", channel.groupId))
      .collect();

    const now = Date.now();
    const WATERCOOLER_WINDOW = 48 * 60 * 60 * 1000; // 48 hours

    for (const member of members) {
      if (member.userId === args.authorId) continue;

      // Hangout uses watercooler logic
      if (channel.type === "hangout") {
        const isRecentlyActive = now - member.lastActiveAt < WATERCOOLER_WINDOW;
        if (!isRecentlyActive) continue;
      }

      await ctx.db.insert("notifications", {
        userId: member.userId,
        groupId: channel.groupId,
        channelId: args.channelId,
        type: "message",
        title: group.name,
        body: args.messageBody.substring(0, 100),
        isRead: false,
        createdAt: now,
      });
    }
  },
});
