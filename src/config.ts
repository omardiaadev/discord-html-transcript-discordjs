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

import {join} from 'node:path';
import {statSync} from 'node:fs';
import envPaths from 'env-paths';
import {Logger} from './internal/logger.js';
import pkg from '../package.json' with {type: 'json'};

const paths = envPaths('discord-html-transcript', { suffix: '' });

type ServerConfig = {
  path: string;
  filename: string;
  version: string;
};

function getServerConfig(): ServerConfig {
  const { version } = pkg.server;
  const { platform, arch } = process;

  const fileExtension = platform === 'win32' ? '.exe' : '';
  const filename = `discord-html-transcript-${version}-${platform}-${arch}${fileExtension}`;

  const defaultPath = join(paths.data, filename);
  const envPath = process.env.DISCORD_HTML_TRANSCRIPT_PATH;

  if (envPath) {
    try {
      Logger.info(`Using custom server path: ${envPath}`);

      if (statSync(envPath).isFile()) {
        return {
          path: envPath,
          filename: filename,
          version: version,
        };
      }
    } catch {
      Logger.warn(
        `Custom server does not exist: ${envPath}
        Defaulting to: ${defaultPath}`
      );
    }
  } else {
    Logger.info(`Using default server path: ${defaultPath}`);
  }

  return {
    path: join(paths.data, filename),
    filename: filename,
    version: version,
  };
}
export const SERVER_CONFIG = getServerConfig();
