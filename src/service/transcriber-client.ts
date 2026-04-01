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
import { TranscriberError } from '../errors/transcriber-error.js';
import { TranscriberFetcher } from '../internal/transcriber-fetcher.js';
import { Server, ServerOptions } from '../internal/server.js';
import { Transcript } from '../model/transcript.js';
import { ServerError } from '../errors/server-error.js';
import { checkChannel, checkClient } from '../util/transcriber-util.js';

/** Transcribes Discord channels into natively styled HTML transcripts. */
export class TranscriberClient {
  private readonly server: Server;
  private readonly fetcher: TranscriberFetcher;

  /**
   * Constructs a new {@linkcode TranscriberClient} instance.
   *
   * @param client The discord.js client instance.
   * @param serverOptions The options used to initialize the {@linkcode Server}.
   * @throws TranscriberMissingIntentsError If the provided {@linkcode client} instance is missing any of
   *   {@linkcode REQUIRED_INTENTS}.
   */
  constructor(client: Client, serverOptions?: ServerOptions) {
    checkClient(client);
    this.server = new Server(serverOptions);
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
   * @returns A promise that resolves with a {@link Transcript}.
   * @throws TranscriberMissingPermissionsError If the provided {@linkcode client} instance lacks permissions in the
   *   provided {@linkcode guildChannel}.
   * @throws TranscriberError If the provided {@linkcode client} encounters an error while retrieving the payload.
   * @throws ServerError If the transcriber server encounters an error while requesting the transcript file.
   */
  public async transcribe(guildChannel: GuildTextBasedChannel): Promise<Transcript> {
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
}
