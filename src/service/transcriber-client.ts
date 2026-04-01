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
  TranscriberError,
  TranscriberInvalidChannelTypeError,
  TranscriberMissingIntentsError,
  TranscriberMissingPermissionsError,
} from '../errors/transcriber-error.js';
import { TranscriberFetcher } from '../internal/transcriber-fetcher.js';
import { Server, ServerOptions } from '../internal/server.js';
import { Transcript } from '../model/transcript.js';

export const REQUIRED_INTENTS =
  GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers | GatewayIntentBits.MessageContent;

export const REQUIRED_PERMISSIONS = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory;

/**
 * Transcribes Discord channels into natively styled HTML transcripts.
 *
 * @example
 *   const transcriber = new TranscriberClient(client); // "client" is the discord.js instance
 *   const transcript = await transcriber.transcribe(channel);
 */
export class TranscriberClient {
  private readonly server: Server;
  private readonly transcriberFetcher: TranscriberFetcher;

  /**
   * Creates a new instance of {@linkcode TranscriberClient}.
   *
   * @param client The discord.js client instance.
   * @param serverOptions The options used to initialize the {@linkcode Server}.
   * @throws TranscriberMissingIntentsError If the provided {@linkcode client} instance is missing any of
   *   {@linkcode REQUIRED_INTENTS}.
   */
  constructor(client: Client, serverOptions?: ServerOptions) {
    if (!client.options.intents.has(REQUIRED_INTENTS)) {
      const missingIntents = client.options.intents.missing(REQUIRED_INTENTS);
      throw new TranscriberMissingIntentsError(missingIntents);
    }

    this.server = new Server(serverOptions);
    this.transcriberFetcher = new TranscriberFetcher(client);
  }

  /** Starts the server and waits for it to initialize. */
  public async start(): Promise<void> {
    await this.server.start();
  }

  /** Gracefully shuts down the server. */
  public stop(): void {
    this.server.stop();
  }

  /**
   * Transcribes the provided {@linkcode guildChannel} into a {@linkcode Transcript}.
   *
   * @param guildChannel The text-based guild channel to transcribe.
   * @returns A promise that resolves with a {@link Transcript}.
   * @throws TranscriberMissingPermissionsError If the provided {@linkcode client} instance lacks permissions in the
   *   provided {@linkcode guildChannel}.
   * @throws Error If the provided {@linkcode client} encountered an error while retrieving the payload, or the
   *   transcript web server fails.
   */
  public async transcribe(guildChannel: GuildTextBasedChannel): Promise<Transcript> {
    if (!this.server.isReady()) {
      throw new Error('Transcriber server is stopped. Did you forget to call "await transcriber.start()"?');
    }

    await this.validateChannel(guildChannel);

    try {
      const [guild, channel, messages] = await Promise.all([
        this.transcriberFetcher.getGuild(guildChannel.guildId),
        this.transcriberFetcher.getChannel(guildChannel.id),
        this.transcriberFetcher.getMessages(guildChannel.id),
      ]);

      const response = await this.server.fetchTranscript({ guild, channel, messages });
      const bytes = await response.bytes();

      return new Transcript(bytes);
    } catch (error) {
      throw new TranscriberError(
        `Failed to generate transcript.
        Channel: ${guildChannel.id}
        Guild: ${guildChannel.guildId}`,
        { cause: error }
      );
    }
  }

  /**
   * Validates the provided {@linkcode channel}.
   *
   * @param channel The text-based guild channel to validate.
   * @throws TranscriberInvalidChannelTypeError If the provided {@linkcode channel} is not of type GuildText (0).
   * @throws TranscriberMissingPermissionsError If the provided {@linkcode channel} is missing any of
   *   {@linkcode REQUIRED_PERMISSIONS}.
   */
  private async validateChannel(channel: GuildTextBasedChannel): Promise<void> {
    if (channel.type !== ChannelType.GuildText) {
      throw new TranscriberInvalidChannelTypeError(channel);
    }

    const member = channel.guild.members.me ?? (await channel.guild.members.fetchMe());

    if (!member.permissionsIn(channel).has(REQUIRED_PERMISSIONS)) {
      const missingPermissions = member.permissionsIn(channel).missing(REQUIRED_PERMISSIONS);
      throw new TranscriberMissingPermissionsError(missingPermissions, channel);
    }
  }
}
