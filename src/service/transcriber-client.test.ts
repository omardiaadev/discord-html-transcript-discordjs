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

import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { after, before, suite, test } from 'node:test';
import { Client, Events, GuildTextBasedChannel } from 'discord.js';
import { Logger } from '../internal/logger.js';
import { TranscriberClient } from './transcriber-client.js';
import { REQUIRED_INTENTS } from '../util/transcriber-util.js';

await suite(
  'TranscriberClient',
  {
    skip:
      (!process.env.DISCORD_BOT_TOKEN && 'Missing DISCORD_BOT_TOKEN environment variable.') ||
      (!process.env.DISCORD_CHANNEL_ID && 'Missing DISCORD_CHANNEL_ID environment variable.'),
  },
  () => {
    const client = new Client({ intents: REQUIRED_INTENTS });
    const transcriber = new TranscriberClient(client);

    before(async () => {
      client.once(Events.ClientReady, (readyClient) => Logger.info(`Logged in as ${readyClient.user.tag}`));

      await client.login(process.env.DISCORD_BOT_TOKEN);
      await transcriber.start();
    });

    after(async () => {
      await client.destroy();
      transcriber.stop();
    });

    test('shouldTranscribe', async () => {
      const channel = (await client.channels.fetch(process.env.DISCORD_CHANNEL_ID!, {
        force: true,
      })) as GuildTextBasedChannel;

      const transcriptDir = join(process.cwd(), 'temp');
      await mkdir(transcriptDir, { recursive: true });
      const transcriptPath = join(transcriptDir, 'transcript.html');

      const transcript = await transcriber.transcribe(channel);
      await transcript.toFile(transcriptPath);

      Logger.info(`Saved file://${transcriptPath}`);
    });
  }
);
