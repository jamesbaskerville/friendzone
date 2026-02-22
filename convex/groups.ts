import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  assertGroupMember,
  assertGroupAdmin,
} from "./lib/permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await Promise.all(
      memberships.map((m) => ctx.db.get(m.groupId))
    );

    return groups.filter(Boolean);
  },
});

export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const memberRows = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberRows.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId);
        return { ...m, user: memberUser };
      })
    );

    return { ...group, members };
  },
});

function generateInviteCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      createdBy: user._id,
      createdAt: now,
      senpaiEnabled: true,
      senpaiFrequency: "normal",
      inviteCode: generateInviteCode(),
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
      lastActiveAt: now,
    });

    await ctx.db.insert("channels", {
      groupId,
      name: "Hangout",
      type: "hangout",
      createdBy: user._id,
      createdAt: now,
      forkDepth: 0,
      isArchived: false,
    });

    return groupId;
  },
});

export const join = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.inviteCode)
      )
      .first();

    if (!group) throw new Error("Invalid invite code");

    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", group._id).eq("userId", user._id)
      )
      .first();

    if (existing) return group._id;

    const now = Date.now();

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId: user._id,
      role: "member",
      joinedAt: now,
      lastActiveAt: now,
    });

    return group._id;
  },
});

export const updateSenpaiSettings = mutation({
  args: {
    groupId: v.id("groups"),
    senpaiEnabled: v.boolean(),
    senpaiFrequency: v.union(
      v.literal("quiet"),
      v.literal("normal"),
      v.literal("chatty")
    ),
    senpaiPersonality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupAdmin(ctx, args.groupId, user._id);

    await ctx.db.patch(args.groupId, {
      senpaiEnabled: args.senpaiEnabled,
      senpaiFrequency: args.senpaiFrequency,
      senpaiPersonality: args.senpaiPersonality,
    });
  },
});
