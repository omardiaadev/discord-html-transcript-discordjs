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

import {accessSync, constants, writeFileSync} from 'node:fs';
import {checkServerDir, validateServer} from '../src/util/server-util.js';
import {SERVER_CONFIG} from '../src/config.js';

downloadServer().catch((err) => {
  console.error('Fatal error during server download:', err);
  process.exit(1);
});

/**
 * Downloads the transcriber web server from GitHub Releases.
 *
 * The download is skipped if `TRANSCRIBER_SERVER_URL` environment variable is set.
 *
 * @see https://github.com/omardiaadev/discord-html-transcript/releases
 */
async function downloadServer() {
  if (SERVER_CONFIG.env.externalUrl) {
    console.log("Found 'TRANSCRIPT_SERVER_URL' environment variable, skipping server download...");
    return;
  }

  try {
    accessSync(SERVER_CONFIG.path, constants.F_OK);
    console.log('Server executable already exists, skipping download...');
    validateServer();
    return;
  } catch (err) {}

  const { platform, arch } = process;
  const extension = platform === 'win32' ? '.exe' : '';

  const filename = `discord-html-transcript-server-${SERVER_CONFIG.version}-${platform}-${arch}${extension}`;
  const url = `https://github.com/omardiaadev/discord-html-transcript/releases/download/${SERVER_CONFIG.version}/${filename}`;

  console.log(`Downloading server: ${url}`);

  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download server: ${response.statusText} (${response.status})`);
  }

  try {
    checkServerDir();
    writeFileSync(SERVER_CONFIG.path, await response.bytes());

    console.log('Download complete.');

    validateServer();
  } catch (err) {
    throw new Error('Failed to save the server to disk.', { cause: err });
  }
}
