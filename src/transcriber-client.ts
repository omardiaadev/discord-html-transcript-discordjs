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
  Client,
  GatewayIntentBits,
  GuildTextBasedChannel,
  IntentsBitField,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import TranscriberClientFetcher from './internal/transcriber-client-fetcher.js';
import Transcript from './model/transcript.js';
import Server from './internal/server.js';
import { InvalidChannelTypeError, MissingIntentsError, MissingPermissionsError } from './errors/transcriber-error.js';

/**
 * Generates HTML Discord channel transcripts.
 *
 * @example
 *   const transcriber = new TranscriberClient(client); // Instantiate once
 *   const transcript = await transcriber.transcribe(channel);
 */
export default class TranscriberClient {
  public static readonly REQUIRED_INTENTS = new IntentsBitField(
    GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers | GatewayIntentBits.MessageContent
  );
  public static readonly REQUIRED_PERMISSIONS = new PermissionsBitField(
    PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory
  );

  private readonly server: Server;
  private readonly transcriberFetcher: TranscriberClientFetcher;

  /**
   * Creates a new instance of {@linkcode TranscriberClient}.
   *
   * @param client The discord.js client instance.
   * @throws MissingIntentsError If the provided {@linkcode client} instance is missing any of
   *   {@linkcode REQUIRED_INTENTS}.
   */
  constructor(client: Client) {
    if (!client.options.intents.has(TranscriberClient.REQUIRED_INTENTS)) {
      const missingIntents = client.options.intents.missing(TranscriberClient.REQUIRED_INTENTS);
      throw new MissingIntentsError(missingIntents);
    }

    this.server = Server.getInstance();
    this.transcriberFetcher = new TranscriberClientFetcher(client);
  }

  /**
   * Transcribes the provided {@linkcode guildChannel} into a {@linkcode Transcript}.
   *
   * @param guildChannel The text-based guild channel to transcribe.
   * @returns A promise that resolves to a {@link Transcript}.
   * @throws Error If the provided {@linkcode client} instance lacks permissions, or the transcript web server fails.
   */
  public async transcribe(guildChannel: GuildTextBasedChannel): Promise<Transcript> {
    await this.server.ready;
    await this.validateChannel(guildChannel);

    const [guild, channel, messages] = await Promise.all([
      this.transcriberFetcher.getGuild(guildChannel.guildId),
      this.transcriberFetcher.getChannel(guildChannel.id),
      this.transcriberFetcher.getMessages(guildChannel.id),
    ]);

    try {
      const response = await this.server.fetchTranscript({ guild, channel, messages });
      const bytes = await response.bytes();

      return new Transcript(bytes);
    } catch (err) {
      throw new Error(
        `Failed to generate transcript due to unknown exception. [Channel: ${channel.id}, Guild: ${guild.id}]`,
        { cause: err }
      );
    }
  }

  /**
   * Validates the provided {@linkcode channel}'s type and required permissions.
   *
   * @param channel The text-based guild channel to validate.
   * @throws InvalidChannelTypeError If the provided {@linkcode channel} is DM-based.
   * @throws MissingPermissionsError If the provided {@linkcode channel} is missing any of
   *   {@linkcode REQUIRED_PERMISSIONS}.
   */
  private async validateChannel(channel: GuildTextBasedChannel): Promise<void> {
    if (channel.isDMBased()) {
      throw new InvalidChannelTypeError(channel);
    }

    const member = channel.guild.members.me ?? (await channel.guild.members.fetchMe());

    if (!member.permissionsIn(channel).has(TranscriberClient.REQUIRED_PERMISSIONS)) {
      const missingPermissions = member.permissionsIn(channel).missing(TranscriberClient.REQUIRED_PERMISSIONS);
      throw new MissingPermissionsError(missingPermissions, channel);
    }
  }
}
