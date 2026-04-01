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

import { ChannelType, Client, GatewayIntentBits, GuildTextBasedChannel, PermissionFlagsBits } from 'discord.js';
import {
  TranscriberInvalidChannelTypeError,
  TranscriberMissingIntentsError,
  TranscriberMissingPermissionsError,
} from '../errors/transcriber-error.js';

export const REQUIRED_INTENTS =
  GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers | GatewayIntentBits.MessageContent;
export const REQUIRED_PERMISSIONS = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory;

export function checkClient(client: Client) {
  if (!client.options.intents.has(REQUIRED_INTENTS)) {
    const missingIntents = client.options.intents.missing(REQUIRED_INTENTS);
    throw new TranscriberMissingIntentsError(missingIntents);
  }
}

/**
 * Checks the provided {@linkcode channel}.
 *
 * @param channel The text-based guild channel to validate.
 * @throws TranscriberInvalidChannelTypeError If the provided {@linkcode channel} is not of type GuildText (0).
 * @throws TranscriberMissingPermissionsError If the provided {@linkcode channel} is missing any of
 *   {@linkcode REQUIRED_PERMISSIONS}.
 */
export async function checkChannel(channel: GuildTextBasedChannel) {
  if (channel.type !== ChannelType.GuildText) {
    throw new TranscriberInvalidChannelTypeError(channel);
  }

  const member = channel.guild.members.me ?? (await channel.guild.members.fetchMe());

  if (!member.permissionsIn(channel).has(REQUIRED_PERMISSIONS)) {
    const missingPermissions = member.permissionsIn(channel).missing(REQUIRED_PERMISSIONS);
    throw new TranscriberMissingPermissionsError(missingPermissions, channel);
  }
}
