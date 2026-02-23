/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as brackets from "../brackets.js";
import type * as channels from "../channels.js";
import type * as crons from "../crons.js";
import type * as dailyGames from "../dailyGames.js";
import type * as events from "../events.js";
import type * as groups from "../groups.js";
import type * as hallOfFame from "../hallOfFame.js";
import type * as lib_gameParser from "../lib/gameParser.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_senpaiPrompt from "../lib/senpaiPrompt.js";
import type * as media from "../media.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as reactions from "../reactions.js";
import type * as senpai from "../senpai.js";
import type * as splits from "../splits.js";
import type * as spotify from "../spotify.js";
import type * as threads from "../threads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  brackets: typeof brackets;
  channels: typeof channels;
  crons: typeof crons;
  dailyGames: typeof dailyGames;
  events: typeof events;
  groups: typeof groups;
  hallOfFame: typeof hallOfFame;
  "lib/gameParser": typeof lib_gameParser;
  "lib/permissions": typeof lib_permissions;
  "lib/senpaiPrompt": typeof lib_senpaiPrompt;
  media: typeof media;
  messages: typeof messages;
  notifications: typeof notifications;
  presence: typeof presence;
  reactions: typeof reactions;
  senpai: typeof senpai;
  splits: typeof splits;
  spotify: typeof spotify;
  threads: typeof threads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
