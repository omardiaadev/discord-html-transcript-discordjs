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

import {
  type APIGuild,
  type APIGuildTextChannel,
  type APIMessage,
  Client,
  type GuildTextChannelType,
  Routes,
  type Snowflake,
} from 'discord.js';
import { TranscriberError } from '../errors/transcriber-error.js';

/** Fetches the required {@linkcode TranscriberPayload} using the provided discord.js instance. */
export class TranscriberFetcher {
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async getGuild(guildId: Snowflake): Promise<APIGuild> {
    return (await this.client.rest.get(Routes.guild(guildId))) as APIGuild;
  }

  public async getChannel(channelId: Snowflake): Promise<APIGuildTextChannel<GuildTextChannelType>> {
    return (await this.client.rest.get(Routes.channel(channelId))) as APIGuildTextChannel<GuildTextChannelType>;
  }

  public async getMessages(channelId: Snowflake, limit: number = Infinity): Promise<APIMessage[]> {
    if (limit <= 0) {
      throw new TranscriberError('limit must be greater than 0.');
    }

    const messages: APIMessage[] = [];
    const query = new URLSearchParams();

    let lastMessageId: Snowflake | undefined;

    while (messages.length < limit) {
      const fetchLimit = Math.min(100, limit - messages.length);

      query.set('limit', fetchLimit.toString());

      if (lastMessageId) {
        query.set('before', lastMessageId);
      }

      const batch = (await this.client.rest.get(Routes.channelMessages(channelId), { query })) as APIMessage[];

      messages.push(...batch);

      if (batch.length < fetchLimit) {
        break;
      }

      lastMessageId = batch.at(-1)?.id;
    }

    return messages.reverse();
  }
}
