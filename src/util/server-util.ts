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

import { dirname } from 'node:path';
import { access, chmod, constants, mkdir, stat, writeFile } from 'node:fs/promises';
import { SERVER_CONFIG } from '../config.js';
import { Logger } from '../internal/logger.js';

/**
 * Validates the server's executable path and permissions.
 *
 * @throws Error If the server executable is missing execution permissions `755` and the running process was unable to
 *   correct it.
 */
export async function validateServer(): Promise<void> {
  if (SERVER_CONFIG.isCustomPath) {
    Logger.info(`Using custom server path: ${SERVER_CONFIG.path}`);
  } else {
    Logger.info(`Using default server path: ${SERVER_CONFIG.path}`);
  }

  await checkServerPath();
  await checkServerPermissions();
}

/**
 * Checks the server executable path.
 *
 * Downloads the server executable if the path doesn't exist.
 */
async function checkServerPath(): Promise<void> {
  const stats = await stat(SERVER_CONFIG.path);

  if (!stats.isFile()) {
    Logger.warn(
      `Custom server path does not exist: ${SERVER_CONFIG.path}.
        Falling back to download...`
    );

    return await downloadServer();
  }
}

/**
 * Checks the server executable permissions and attempts to set the correct permissions manually if they are incorrect.
 *
 * @throws Error If `chmod` fails.
 */
async function checkServerPermissions(): Promise<void> {
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

/**
 * Downloads the server.
 *
 * @throws Error If the download fails.
 * @throws Error If the file fails to save to disk.
 */
async function downloadServer(): Promise<void> {
  const url = `https://github.com/omardiaadev/discord-html-transcript/releases/download/${SERVER_CONFIG.version}/${SERVER_CONFIG.filename}`;

  Logger.info(`Downloading ${url}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download server executable.
      ${response.status} ${response.statusText}`
    );
  }

  try {
    const bytes = await response.bytes();

    await mkdir(dirname(SERVER_CONFIG.path), { recursive: true });
    await writeFile(SERVER_CONFIG.path, bytes);

    Logger.info(`Downloaded: ${SERVER_CONFIG.path}`);
  } catch (error) {
    throw new Error(
      `Failed to save server executable.
      If you meant to use a local server, ensure DISCORD_HTML_TRANSCRIPT_PATH exists.
      If you meant to use a remote server, please configure TranscriberClient.`,
      { cause: error }
    );
  }
}
