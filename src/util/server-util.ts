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

import { constants, existsSync } from 'node:fs';
import { SERVER_CONFIG } from '../config.js';
import { Logger } from '../internal/logger.js';
import { dirname } from 'node:path';
import { access, chmod, mkdir, writeFile } from 'node:fs/promises';

/**
 * Validates the server's executable path and permissions.
 *
 * @throws Error If the server executable is not found.
 * @throws Error If the server executable is missing execution permissions `755` and the running process was unable to
 *   set it.
 */
export async function validateServer(): Promise<void> {
  await checkServerPath();
  await checkServerPermissions();
}

/**
 * Checks the server executable path.
 *
 * Downloads the server executable if the path doesn't exist.
 */
export async function checkServerPath(): Promise<void> {
  if (!existsSync(SERVER_CONFIG.path)) {
    await downloadServer();
  }
}

/**
 * Checks the server executable permissions. Additionally, will attempt to set the correct permissions on the server
 * executable path.
 *
 * @throws Error if `chmodSync` fails.
 */
export async function checkServerPermissions(): Promise<void> {
  if (process.platform === 'win32') {
    return;
  }

  try {
    await access(SERVER_CONFIG.path, constants.X_OK);
  } catch {
    Logger.warn('Server executable permissions are missing, attempting to set them...');

    try {
      await chmod(SERVER_CONFIG.path, 0o755);
      Logger.info('Server executable permissions set to 755.');
    } catch (error) {
      throw new Error(
        `Failed to set server executable permissions.
        Please run 'chmod +x ${SERVER_CONFIG.path}'`,
        { cause: error }
      );
    }
  }
}

async function downloadServer(): Promise<void> {
  const { path, filename, version } = SERVER_CONFIG;
  const url = `https://github.com/omardiaadev/discord-html-transcript/releases/download/${version}/${filename}`;

  Logger.info(
    `Server not found: ${path}
    Downloading ${url}...`
  );

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from(buffer));

    Logger.info(`Downloaded: ${path}`);
  } catch (error) {
    throw new Error(
      `Failed to download server executable.
      If you meant to use a local server, ensure DISCORD_HTML_TRANSCRIPT_PATH points to an existing file.
      If you meant to use an external server, please configure TranscriberClient.
      Download URL: ${url}`,
      { cause: error }
    );
  }
}
