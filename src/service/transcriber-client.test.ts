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
import { Client, Events } from 'discord.js';
import { TranscriberClient } from './transcriber-client.js';
import { REQUIRED_INTENTS } from '../config.js';

const client = new Client({ intents: REQUIRED_INTENTS });
const transcriber = new TranscriberClient(client);

beforeAll(async () => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error('Missing DISCORD_BOT_TOKEN environment variable.');
  }

  if (!process.env.DISCORD_CHANNEL_ID) {
    throw new Error('Missing DISCORD_CHANNEL_ID environment variable.');
  }

  await client
    .login(process.env.DISCORD_BOT_TOKEN)
    .then(() => console.log('[Bot] Logging in...'))
    .catch((err) => {
      throw new Error('[Bot] Failed to login.', { cause: err });
    });

  await transcriber.start();

  client.once(Events.ClientReady, (readyClient) => console.log(`[Bot] Logged in as ${readyClient.user.tag}.`));
}, 30000);

afterAll(async () => {
  await client.destroy();
  transcriber.stop();
});

test('shouldCreateTranscript', async () => {
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID as string, { force: true });

  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Channel specified by DISCORD_CHANNEL_ID is not a TextChannel or does not exist.');
  }

  const transcript = await transcriber.transcribe(channel);
  const transcriptDir = join(process.cwd(), 'dist');

  mkdirSync(transcriptDir, { recursive: true });

  const transcriptPath = join(transcriptDir, 'transcript.html');
  await transcript.toFile(transcriptPath);
  console.log(`Saved file://${transcriptPath}`);
}, 30000);
