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

import { ServerErrorPayload } from '../types.js';

/**
 * Implementation for server errors.
 *
 * @see https://github.com/omardiaadev/discord-html-transcript/blob/main/server/src/main/java/dev/omardiaa/transcript/server/exception/GlobalExceptionHandler.java
 */
export class ServerError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ServerMismatchedVersionError extends ServerError {
  constructor(error: ServerErrorPayload) {
    super(
      `${error.message}
      Client: "${error.details?.client}"
      Server: "${error.details?.server}"`
    );
  }
}

export class ServerMismatchedInputError extends ServerError {
  constructor(error: ServerErrorPayload) {
    super(
      `${error.message}
      Path: "${error.details?.path}"
      Problem: "${error.details?.problem}"`
    );
  }
}

export class ServerAuthenticationError extends ServerError {
  constructor() {
    super('Failed to authenticate client with the transcriber server.');
  }
}
