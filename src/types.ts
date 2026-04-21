/*
 * Copyright 2026 Omar Diaa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { APIGuild, APIGuildTextChannel, APIMessage, GuildTextChannelType } from 'discord.js';

export interface AttachmentOptions {
  /** Whether images should be downloaded and saved, defaults to `false`. */
  save_images?: boolean;
}

export interface StyleOptions {
  /** The path to a custom `style.css`, defaults to inline styles if `undefined`. */
  path?: string;
}

export interface TranscriberPayloadOptions {
  attachment?: AttachmentOptions;
  style?: StyleOptions;
  /** The maximum number of messages to fetch in a channel, defaults to `Infinity`. */
  limit?: number;
}

export interface TranscriberPayload {
  guild: APIGuild;
  channel: APIGuildTextChannel<GuildTextChannelType>;
  messages: APIMessage[];
  options?: TranscriberPayloadOptions;
}

export interface ServerErrorPayload {
  status: number;
  message: string;
  details?: Record<string, string>;
}
