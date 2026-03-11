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

import { APIGuild, APIGuildTextChannel, APIMessage, Client, GuildTextChannelType, Routes, Snowflake } from 'discord.js';

/** Fetches the required {@link Payload} using the provided discord.js instance. */
export default class TranscriberClientFetcher {
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

  public async getMessages(channelId: Snowflake): Promise<APIMessage[]> {
    const messages: APIMessage[] = [];
    let lastMessageId: Snowflake | undefined;

    while (true) {
      const query = new URLSearchParams({ limit: '100' });

      if (lastMessageId) {
        query.append('before', lastMessageId);
      }

      const batch = (await this.client.rest.get(Routes.channelMessages(channelId), { query })) as APIMessage[];

      messages.push(...batch);

      if (batch.length < 100) {
        break;
      }

      lastMessageId = batch[batch.length - 1].id;
    }

    return messages.toReversed();
  }
}
