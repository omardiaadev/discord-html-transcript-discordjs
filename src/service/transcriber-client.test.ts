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

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client, Events, GuildTextBasedChannel } from 'discord.js';
import { Logger } from '../internal/logger.js';
import { REQUIRED_INTENTS, TranscriberClient } from './transcriber-client.js';

const client = new Client({ intents: REQUIRED_INTENTS });
const transcriber = new TranscriberClient(client);

beforeAll(async () => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error('Missing DISCORD_BOT_TOKEN environment variable.');
  }

  if (!process.env.DISCORD_CHANNEL_ID) {
    throw new Error('Missing DISCORD_CHANNEL_ID environment variable.');
  }

  await transcriber.start();
  await client.login(process.env.DISCORD_BOT_TOKEN);

  client.once(Events.ClientReady, (readyClient) => Logger.info(`Logged in as ${readyClient.user.tag}`));
}, 30000);

afterAll(async () => {
  await client.destroy();
  transcriber.stop();
});

test('shouldCreateTranscript', async () => {
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID as string, { force: true });

  const transcript = await transcriber.transcribe(channel as GuildTextBasedChannel);
  const transcriptDir = join(process.cwd(), 'temp');

  mkdirSync(transcriptDir, { recursive: true });

  const transcriptPath = join(transcriptDir, 'transcript.html');
  await transcript.toFile(transcriptPath);

  Logger.info(`Saved file://${transcriptPath}`);
}, 30000);
