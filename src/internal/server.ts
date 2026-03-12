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

import { ChildProcess, spawn } from 'node:child_process';
import { SERVER_CONFIG } from '../config.js';
import { validateServer } from '../util/server-util.js';
import { TranscriberPayload } from '../model/transcriber-payload.js';
import { ServerErrorPayload } from '../model/server-error-payload.js';
import {
  ServerAuthenticationError,
  ServerConnectionError,
  ServerMismatchedInputError,
  ServerMismatchedVersionError,
} from '../error/server-error.js';

export class Server {
  private static readonly INSTANCE: Server = new Server();

  private readonly host: string;
  private readonly port: number;
  private readonly url: string;
  public readonly ready: Promise<void>;

  private process: ChildProcess | null = null;

  private constructor() {
    this.host = SERVER_CONFIG.env.host;
    this.port = SERVER_CONFIG.env.port;
    this.url = SERVER_CONFIG.env.externalUrl || `http://${this.host}:${this.port}`;
    this.ready = this.start();

    if (!SERVER_CONFIG.env.externalUrl) {
      process.on('exit', this.stop);
      process.on('SIGINT', this.stop);
      process.on('SIGKILL', this.stop);
    }
  }

  /** @returns The {@linkcode Server} singleton instance. */
  public static getInstance(): Server {
    return Server.INSTANCE;
  }

  /**
   * Starts the server and waits for the HTTP server to initialize.
   *
   * If `TRANSCRIPT_SERVER_URL` is undefined, the method attempts to start a local server with the specified
   * {@linkcode host} and {@linkcode port}.
   *
   * If `TRANSCRIPT_SERVER_URL` is set, the method attempts to connect to the external server with the specified
   * {@linkcode url}.
   */
  public async start(): Promise<void> {
    if (SERVER_CONFIG.env.externalUrl) {
      console.log(`Connecting to external server: ${this.url}`);
    } else {
      if (this.process) {
        console.log('Server already started.');
        return;
      }

      console.log(`Starting local server...`);

      validateServer();

      this.process = spawn(SERVER_CONFIG.path, {
        stdio: 'inherit',
        env: {
          ...process.env,
          TRANSCRIPT_SERVER_HOST: this.host,
          TRANSCRIPT_SERVER_PORT: String(this.port),
        },
      });
    }

    await this.fetchHealth();
    console.log(`Server started: ${this.url}`);
  }

  /** Gracefully shuts down the server. */
  public stop(): void {
    if (this.process) {
      console.log('Shutting down server...');
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * `POST /transcript` Endpoint.\
   * Generates a transcript by sending the payload.
   *
   * @param payload The transcript {@linkcode TranscriberPayload}.
   * @returns A promise of {@linkcode Response}.
   */
  public async fetchTranscript(payload: TranscriberPayload): Promise<Response> {
    return await this.request('/transcript', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * `GET /health` Endpoint.\
   * Retrieves basic server information.
   */
  private async fetchHealth(): Promise<Response> {
    return await this.request('/health', { method: 'GET' });
  }

  /**
   * HTTP request wrapper for the transcriber web server.
   *
   * @param endpoint The endpoint to request.
   * @param init The request options.
   * @returns A promise of {@linkcode Response}.
   */
  private async request(endpoint: string, init?: RequestInit): Promise<Response> {
    const url = new URL(endpoint, this.url);
    const headers = new Headers(init?.headers);

    headers.set('Server-Version', SERVER_CONFIG.version);
    headers.set('Content-Type', 'application/json');

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
          throw new ServerConnectionError(this.url);
      }
    }

    return response;
  }
}
