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

import { PACKAGE_ROOT_DIR } from '../util/util.js';
import { join } from 'node:path';
import packageData from '../../package.json' with { type: 'json' };

export const SERVER_CONFIG = {
  dir: join(PACKAGE_ROOT_DIR, 'bin'),
  path: join(PACKAGE_ROOT_DIR, 'bin', `server${process.platform === 'win32' ? '.exe' : ''}`),
  version: packageData.server.version,
  env: {
    host: process.env.TRANSCRIPT_SERVER_HOST?.trim() || '127.0.0.1',
    port: Number(process.env.TRANSCRIPT_SERVER_PORT) || 7000,
    externalUrl: process.env.TRANSCRIPT_SERVER_URL?.trim(),
  },
} as const;
