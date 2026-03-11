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

import { Channel, GatewayIntentsString, GuildTextBasedChannel, PermissionsString } from 'discord.js';

class TranscriberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** Indicates that a discord.js client instance is missing required intents. */
export class MissingIntentsError extends TranscriberError {
  public readonly intents: GatewayIntentsString[];

  constructor(intents: GatewayIntentsString[]) {
    super(`Client is missing [${intents.join(', ')}] intents.`);
    this.intents = intents;
  }
}

/** Indicates that a discord.js client instance is missing required permissions. */
export class MissingPermissionsError extends TranscriberError {
  public readonly permissions: PermissionsString[];

  constructor(permissions: PermissionsString[], channel: GuildTextBasedChannel) {
    super(
      `Client is missing [${permissions.join(', ')}] permissions in [Channel: ${channel.id}, Guild: ${channel.guildId}]`
    );
    this.permissions = permissions;
  }
}

export class InvalidChannelTypeError extends TranscriberError {
  public readonly channel: Channel;

  constructor(channel: Channel) {
    super(`Channel must be of type GUILD_TEXT`);
    this.channel = channel;
  }
}
