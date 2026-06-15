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

import { SERVER_CONFIG } from '../config.js';
import type { ServerErrorPayload, TranscriberPayload } from '../types.js';
import {
  ServerAuthenticationError,
  ServerError,
  ServerMismatchedInputError,
  ServerMismatchedVersionError,
} from '../errors/server-error.js';

/** Represents the server's requests helper. */
export class ServerFetcher {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.trim();
    this.apiKey = apiKey;
  }

  public async fetchTranscript(payload: TranscriberPayload): Promise<Response> {
    return this.request('/transcript', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async fetchHealth(): Promise<Response> {
    return this.request('/health', { method: 'GET' });
  }

  /**
   * An internal wrapper for making HTTP requests to the transcriber server.\
   * Automatically appends required headers and parses common server errors into custom typed exceptions.
   *
   * @param endpoint The request path (e.g. `/transcript`).
   * @param init The request options.
   * @returns A promise resolving to the request's {@linkcode Response}.
   */
  private async request(endpoint: string, init?: RequestInit): Promise<Response> {
    const url = new URL(endpoint, this.baseUrl);
    const headers = new Headers(init?.headers);

    headers.set('Server-Version', SERVER_CONFIG.version);

    if (init?.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      const error = (await response.json()) as ServerErrorPayload;

      switch (response.status) {
        case 400:
          throw new ServerMismatchedInputError(error);
        case 401:
          throw new ServerAuthenticationError();
        case 409:
          throw new ServerMismatchedVersionError(error);
        default:
          throw new ServerError(`Failed to reach server at ${this.baseUrl}`, { cause: error });
      }
    }

    return response;
  }
}
