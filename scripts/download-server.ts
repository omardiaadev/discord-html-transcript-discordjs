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

import { writeFileSync } from 'node:fs';
import { SERVER_CONFIG } from '../src/config.js';
import { Logger } from '../src/internal/logger.js';
import { checkServerDir, validateServer } from '../src/util/server-util.js';

downloadServer().catch((error) => {
  Logger.error(error);
  process.exit(0);
});

/**
 * Downloads the transcriber executable server.
 *
 * The download is skipped if:
 *
 * - Environment variable `TRANSCRIPT_SERVER_SKIP_DOWNLOAD` is set to `true`.
 * - NPM flag `--transcript-server-skip-download` is set to `true`.
 *
 * @see https://github.com/omardiaadev/discord-html-transcript/releases
 */
async function downloadServer() {
  const flagSkip = Boolean(process.env.npm_config_transcript_server_skip_download);
  const envSkip = Boolean(process.env.TRANSCRIPT_SERVER_SKIP_DOWNLOAD);

  if (flagSkip || envSkip) {
    Logger.info('Skipping server executable download due to configuration...');
    return;
  }

  try {
    validateServer();
    Logger.info('Server executable exists, skipping download...');
  } catch {
    const { path, filename, version } = SERVER_CONFIG;
    const url = `https://github.com/omardiaadev/discord-html-transcript/releases/download/${version}/${filename}`;

    Logger.info(`Downloading ${url}...`);

    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(
        `Failed to download server: ${response.status} ${response.statusText}.
        Download URL: ${url}`
      );
    }

    try {
      checkServerDir();
      writeFileSync(path, Buffer.from(await response.arrayBuffer()));

      Logger.info(`Saved download: ${path}`);

      validateServer();
    } catch (error) {
      throw new Error('Failed to save the server to disk.', { cause: error });
    }
  }
}
