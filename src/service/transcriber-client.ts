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

import { Client, GuildTextBasedChannel } from 'discord.js';
import { TranscriberFetcher } from '../internal/transcriber-fetcher.js';
import { Server, ServerOptions } from '../internal/server.js';
import { TranscriberError } from '../errors/transcriber-error.js';
import { ServerError } from '../errors/server-error.js';
import { Transcript } from '../model/transcript.js';
import { checkChannel, checkClient } from '../util/transcriber-util.js';
import { TranscriberPayloadOptions } from '../types.js';

/**
 * @example
 *   import { REQUIRED_INTENTS, TranscriberClient } from 'discord-html-transcript-discordjs';
 *   import { Client, Events, MessageFlags, Routes, SlashCommandBuilder } from 'discord.js';
 *
 *   const client = new Client({ intents: REQUIRED_INTENTS });
 *   const transcriber = new TranscriberClient(client);
 *
 *   client.once(Events.ClientReady, (readyClient) => console.log(`Logged in as ${readyClient.user.tag}`));
 *
 *   client.on(Events.InteractionCreate, async (interaction) => {
 *     if (!interaction.isChatInputCommand()) return;
 *
 *     const { channel } = interaction;
 *
 *     // safely retrieve the channel
 *     if (!channel) {
 *       await interaction.reply({
 *         content: 'Failed to retrieve channel.',
 *         flags: MessageFlags.Ephemeral,
 *       });
 *       return;
 *     }
 *
 *     // safely check the channel's type
 *     if (channel.isDMBased() || !channel.isTextBased) {
 *       await interaction.reply({
 *         content: 'This command can only be used in guild text channels.',
 *         flags: MessageFlags.Ephemeral,
 *       });
 *       return;
 *     }
 *
 *     try {
 *       // acknowledge the interaction before Discord expires it
 *       // this is required in instances where a channel may have a large amount of messages to retrieve
 *       await interaction.deferReply({ flags: MessageFlags.Ephemeral });
 *
 *       const transcript = await transcriber.transcribe(channel, {
 *         attachment: { save_images: true },
 *       });
 *
 *       const attachment = transcript.toAttachmentBuilder({ name: channel.name });
 *
 *       // send the generated transcript
 *       await interaction.followUp({ files: [attachment] });
 *     } catch (error) {
 *       await interaction.followUp({ content: 'Failed to generate transcript.' });
 *     }
 *   });
 *
 *   await transcriber.start();
 *   await client.login(process.env.DISCORD_BOT_TOKEN);
 */
export class TranscriberClient {
  private readonly server: Server;
  private readonly fetcher: TranscriberFetcher;

  /**
   * Constructs a new {@linkcode TranscriberClient} instance.
   *
   * @param client The discord.js client instance.
   * @param config The configuration used to initialize the {@linkcode Server}.
   * @throws TranscriberMissingIntentsError If the provided {@linkcode Client} instance is missing any of
   *   {@linkcode REQUIRED_INTENTS}.
   */
  constructor(client: Client, config?: ServerOptions) {
    checkClient(client);
    this.server = new Server(config);
    this.fetcher = new TranscriberFetcher(client);
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
   * @param options The options used to generate the {@linkcode Transcript}.
   * @returns A promise that resolves with a {@link Transcript}.
   * @throws TranscriberMissingPermissionsError If the provided {@linkcode client} instance lacks permissions in the
   *   provided {@linkcode guildChannel}.
   * @throws TranscriberError If the provided {@linkcode client} encounters an error while retrieving the payload.
   * @throws ServerError If the transcriber server encounters an error while requesting the transcript file.
   */
  public async transcribe(
    guildChannel: GuildTextBasedChannel,
    options?: TranscriberPayloadOptions
  ): Promise<Transcript> {
    if (!this.server.isReady()) {
      throw new ServerError('Server is stopped. Did you forget to call "await transcriber.start()"?');
    }

    await checkChannel(guildChannel);

    try {
      const [guild, channel, messages] = await Promise.all([
        this.fetcher.getGuild(guildChannel.guildId),
        this.fetcher.getChannel(guildChannel.id),
        this.fetcher.getMessages(guildChannel.id),
      ]);

      const response = await this.server.fetchTranscript({ guild, channel, messages, options });
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
}
