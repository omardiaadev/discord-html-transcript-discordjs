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
  ServerError,
  ServerMismatchedInputError,
  ServerMismatchedVersionError,
} from '../errors/server-error.js';
import { ServerErrorPayload, TranscriberPayload } from '../types.js';
import { validateServer } from '../util/server-util.js';
import { Logger } from './logger.js';

enum Status {
  Started = 'started',
  Starting = 'starting',
  Stopped = 'stopped',
}

export type SharedServerOptions = {
  /** An optional API key for authenticating the client with the server. */
  apiKey?: string;
};

export type LocalServerOptions = SharedServerOptions & {
  /** The host on which the local server will bind to (default: `127.0.0.1`). */
  host?: string;
  /** The port on which the local server will listen to (default: `7000`). */
  port?: number;
  externalUrl?: never;
  enableLogs?: boolean;
};

export type ExternalServerOptions = SharedServerOptions & {
  /** An existing external server URL to connect to, bypassing local server creation. */
  host?: never;
  port?: never;
  externalUrl: string;
  enableLogs?: never;
};

export type ServerOptions = LocalServerOptions | ExternalServerOptions;

type ServerConfig =
  | { isExternal: true; url: string; apiKey?: string }
  | { isExternal: false; url: string; apiKey?: string; host: string; port: number; enableLogs: boolean };

/** Represents the transcriber server, managing its configuration, lifecycle, and HTTP requests. */
export class Server {
  private readonly config: ServerConfig;
  private readonly handleExit = () => this.stop();

  private status: Status = Status.Stopped;
  private process: ChildProcess | null = null;

  constructor(options: ServerOptions = {}) {
    if (options.externalUrl) {
      this.config = {
        isExternal: true,
        url: options.externalUrl,
        apiKey: options.apiKey,
      };
    } else {
      const host = options.host?.trim() || '127.0.0.1';
      const port = options.port ?? 7000;

      this.config = {
        isExternal: false,
        url: `http://${host}:${port}`,
        apiKey: options.apiKey,
        host: host,
        port: port,
        enableLogs: options.enableLogs ?? true,
      };

      validateServer();
      process.on('exit', this.handleExit);
    }
  }

  /**
   * Starts the server and waits its readiness.
   *
   * If an `externalUrl` was provided in the initialization options, this method will attempt to connect to that
   * external server. Otherwise, it spawns a local server process using The configured `host` and `port`.
   *
   * @returns A promise that resolves with the readiness of the server.
   * @throws ServerError If the server cannot be reached.
   */
  public async start(): Promise<void> {
    if (this.status !== Status.Stopped) {
      Logger.warn(`Server is already ${this.status}.`);
      return;
    }

    this.status = Status.Starting;

    if (this.config.isExternal) {
      Logger.info(`Connecting to external server at ${this.config.url}`);
    } else {
      Logger.info(`Starting local server at ${this.config.url}...`);

      this.process = spawn(SERVER_CONFIG.path, {
        stdio: ['pipe', this.config.enableLogs ? 'inherit' : 'ignore', this.config.enableLogs ? 'inherit' : 'ignore'],
        env: {
          ...process.env,
          TRANSCRIPT_SERVER_HOST: this.config.host,
          TRANSCRIPT_SERVER_PORT: String(this.config.port),
        },
      });
    }

    await this.checkReady();
    this.status = Status.Started;
    Logger.info(`Started server at ${this.config.url}`);
  }

  /**
   * Polls the server's `GET /health` endpoint to verify its readiness.
   *
   * @param maxAttempts The maximum number of connection attempts before failing.
   * @param attemptIntervalMs The interval between each connection attempt in milliseconds.
   */
  private async checkReady(maxAttempts = 20, attemptIntervalMs = 500): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.fetchHealth();
        return;
      } catch (error) {
        if (error instanceof ServerError) throw error;
        if (attempt === maxAttempts) throw error;
        await new Promise((resolve) => setTimeout(resolve, attemptIntervalMs));
      }
    }
  }

  /** Gracefully stops the local server. */
  public stop(): void {
    if (this.process) {
      Logger.info('Stopping server...');
      this.process.kill();
      this.process = null;
    }

    if (!this.config.isExternal) {
      process.off('exit', this.handleExit);
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
    const url = new URL(endpoint, this.config.url);
    const headers = new Headers(init?.headers);

    headers.set('Server-Version', SERVER_CONFIG.version);

    if (init?.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.config.apiKey) {
      headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      let error: ServerErrorPayload | undefined;

      try {
        error = (await response.json()) as ServerErrorPayload;
      } catch {
        throw new ServerConnectionError(this.config.url);
      }

      switch (response.status) {
        case 400:
          throw new ServerMismatchedInputError(error);
        case 401:
          throw new ServerAuthenticationError();
        case 409:
          throw new ServerMismatchedVersionError(error);
        default:
          throw new ServerConnectionError(this.config.url);
      }
    }

    return response;
  }
}
