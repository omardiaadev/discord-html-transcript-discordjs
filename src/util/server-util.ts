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

import { accessSync, chmodSync, constants, mkdirSync } from 'node:fs';
import { SERVER_CONFIG } from '../config.js';

/**
 * Validates the server's executable path and permissions.
 *
 * @throws Error If the server executable is not found.
 * @throws Error If the server executable is missing execution permissions `755` and the running process was unable to
 *   set it.
 */
export function validateServer() {
  checkServerDir();
  checkServerPath();

  if (process.platform !== 'win32') {
    checkServerPermissions();
  }
}

export function checkServerDir() {
  try {
    mkdirSync(SERVER_CONFIG.dir, { recursive: true });
  } catch (err) {
    throw new Error('Failed to create missing server executable directory.', { cause: err });
  }
}

export function checkServerPath() {
  try {
    accessSync(SERVER_CONFIG.path, constants.F_OK);
  } catch (err) {
    throw new Error(
      `Server executable not found at: ${SERVER_CONFIG.path}
      If you meant to use a local server, run 'npm install' without --ignore-scripts.
      If you meant to use an external server, make sure to configure TranscriberClient.`,
      { cause: err }
    );
  }
}

export function checkServerPermissions() {
  try {
    accessSync(SERVER_CONFIG.path, constants.X_OK);
  } catch (err) {
    console.warn('Server executable permissions are missing, attempting to set them...');

    try {
      chmodSync(SERVER_CONFIG.path, 0o755);
      console.log('Server executable permissions set to 755.');
    } catch (chmodErr) {
      throw new Error(
        `Failed to set server executable permissions.
        Please run 'chmod +x ${SERVER_CONFIG.path}'`,
        { cause: chmodErr }
      );
    }
  }
}
