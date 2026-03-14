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
import {
  ServerAuthenticationError,
  ServerConnectionError,
  ServerMismatchedInputError,
  ServerMismatchedVersionError,
} from '../error/server-error.js';
import { ServerErrorPayload, TranscriberPayload } from '../types.js';
import { validateServer } from '../util/server-util.js';

enum Status {
  Started,
  Starting,
  Stopped,
}

export type ServerOptions = {
  /** The local host to bind to (default: '127.0.0.1'). */
  host?: string;
  /** The port on which the local server will listen (default: 7000). */
  port?: number;
  /** An optional API key for authenticating with the server. */
  apiKey?: string;
  /** An existing external server URL to connect to, bypassing local server creation. */
  externalUrl?: string;
};

/** Represents the transcriber server, managing its configuration, lifecycle, and HTTP requests. */
export class Server {
  private readonly host: string;
  private readonly port: number;
  private readonly url: string;
  private readonly apiKey: string | undefined;
  private readonly isExternal: boolean;

  private status: Status = Status.Stopped;
  private process: ChildProcess | null = null;

  constructor(options: ServerOptions = {}) {
    this.host = options.host?.trim() ?? '127.0.0.1';
    this.port = options.port ?? 7000;
    this.url = options.externalUrl ?? `http://${this.host}:${this.port}`;
    this.apiKey = options.apiKey;
    this.isExternal = options.externalUrl !== undefined;

    if (!this.isExternal) {
      validateServer();
      process.on('exit', () => this.stop());
    }
  }

  /**
   * Starts the server and waits for the HTTP interface to initialize.
   *
   * If an `externalUrl` was provided in the initialization options, this method will attempt to connect to that
   * external server. Otherwise, it spawns a local server process using The configured `host` and `port`.
   *
   * @returns A promise that resolves when the server is ready for requests.
   * @throws ServerConnectionError If the server fails to start or cannot be reached.
   */
  public async start(): Promise<void> {
    this.status = Status.Starting;

    if (this.isExternal) {
      console.log(`Connecting to external transcriber server: ${this.url}`);
    } else {
      console.log(`Starting local transcriber server...`);

      this.process = spawn(SERVER_CONFIG.path, {
        stdio: 'inherit',
        env: {
          ...process.env,
          TRANSCRIPT_SERVER_HOST: this.host,
          TRANSCRIPT_SERVER_PORT: String(this.port),
        },
      });
    }

    try {
      await this.checkReady();
      this.status = Status.Started;
      console.log(`Transcriber server started: ${this.url}`);
    } catch (err) {
      this.stop();
      throw new ServerConnectionError(this.url);
    }
  }

  /**
   * Polls the server's `GET /health` endpoint to verify its readiness.
   *
   * @param maxAttempts The maximum number of connection attempts before failing.
   * @param intervalMs The delay in milliseconds between each connection attempt.
   */
  private async checkReady(maxAttempts = 20, intervalMs = 500): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.fetchHealth();
        return;
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  /** Gracefully shuts down the local server. */
  public stop(): void {
    if (this.process) {
      console.log('Shutting down transcriber server...');
      this.process.kill();
      this.process = null;
    }

    this.status = Status.Stopped;
  }

  /** @returns `true` if the server is ready to accept requests, otherwise `false`. */
  public isReady(): boolean {
    return this.status === Status.Started;
  }

  /**
   * `POST /transcript` Endpoint.\
   * Generates a transcript by sending the provided payload to the server.
   *
   * @param payload The transcript {@linkcode TranscriberPayload}.
   * @returns A promise resolving to the request's {@linkcode Response}.
   */
  public async fetchTranscript(payload: TranscriberPayload): Promise<Response> {
    return this.request('/transcript', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * `GET /health` Endpoint.\
   * Retrieves basic server information.
   *
   * @returns A promise resolving to the request's {@linkcode Response}.
   */
  private async fetchHealth(): Promise<Response> {
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
    const url = new URL(endpoint, this.url);
    const headers = new Headers(init?.headers);

    headers.set('Server-Version', SERVER_CONFIG.version);
    headers.set('Content-Type', 'application/json');

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      let error: ServerErrorPayload | undefined;

      try {
        error = (await response.json()) as ServerErrorPayload;
      } catch {
        throw new ServerConnectionError(this.url);
      }

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
