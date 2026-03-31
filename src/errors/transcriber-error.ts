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

/** Server error implementation. */
export class TranscriberError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** Indicates that the provided discord.js instance is missing required intents. */
export class TranscriberMissingIntentsError extends TranscriberError {
  public readonly intents: GatewayIntentsString[];

  constructor(intents: GatewayIntentsString[]) {
    super(
      `Client is missing required intents.
      Required Intents: ${intents.join(', ')}`
    );
    this.intents = intents;
  }
}

/** Indicates that the provided discord.js instance is missing required permissions. */
export class TranscriberMissingPermissionsError extends TranscriberError {
  public readonly permissions: PermissionsString[];

  constructor(permissions: PermissionsString[], channel: GuildTextBasedChannel) {
    super(
      `Client is missing required permissions.
      Required Permissions: ${permissions.join(', ')}
      Channel: ${channel.id}
      Guild: ${channel.guildId}`
    );
    this.permissions = permissions;
  }
}

/** Indicates that the provided channel's type is invalid. */
export class TranscriberInvalidChannelTypeError extends TranscriberError {
  constructor(channel: Channel) {
    super(
      `Channel must be of type GUILD_TEXT (0).
      Channel: ${channel.id}`
    );
  }
}
