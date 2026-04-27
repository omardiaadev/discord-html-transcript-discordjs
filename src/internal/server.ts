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

import { ChildProcess, spawn, StdioNull } from 'node:child_process';
import { ServerError } from '../errors/server-error.js';
import { validateServer } from '../util/server-util.js';
import { SERVER_CONFIG } from '../config.js';
import { Logger } from './logger.js';
import { ServerFetcher } from './server-fetcher.js';

type ServerConfig =
  | {
      isRemote: true;
      url: string;
      apiKey?: string;
    }
  | {
      isRemote: false;
      url: string;
      apiKey?: string;
      host: string;
      port: number;
      stdio: StdioNull;
    };

type Status = 'started' | 'starting' | 'stopped';

interface SharedServerOptions {
  /** An optional API key for authenticating the client with the server. */
  apiKey?: string;
}

interface LocalServerOptions extends SharedServerOptions {
  /** The host on which the local server will bind to (default: `127.0.0.1`). */
  host?: string;
  /** The port on which the local server will listen to (default: `7000`). */
  port?: number;
  url?: never;
  showLogs?: boolean;
}

interface RemoteServerOptions extends SharedServerOptions {
  host?: never;
  port?: never;
  /** An existing external server URL to connect to, bypassing local server creation. */
  url: string;
  showLogs?: never;
}

export type ServerOptions = LocalServerOptions | RemoteServerOptions;

/** Represents the transcriber server, managing its configuration, lifecycle, and HTTP requests. */
export class Server {
  public readonly fetcher: ServerFetcher;
  private readonly config: ServerConfig;
  private readonly handleExit: () => void;

  private status: Status;
  private process: ChildProcess | null;
  private startPromise: Promise<void> | null = null;

  constructor(options: ServerOptions = {}) {
    const host = options.host?.trim() || '127.0.0.1';
    const port = options.port ?? 7000;
    const url = options.url || `http://${host}:${port}`;

    this.fetcher = new ServerFetcher(url, options.apiKey);
    this.config = options.url
      ? {
          isRemote: true,
          url: url,
          apiKey: options.apiKey,
        }
      : {
          isRemote: false,
          url: url,
          apiKey: options.apiKey,
          host: host,
          port: port,
          stdio: options.showLogs ? 'inherit' : 'ignore',
        };
    this.handleExit = () => this.stop();
    this.status = 'stopped';
    this.process = null;
  }

  /**
   * Starts the server and waits its readiness.
   *
   * If an `externalUrl` was provided in the initialization options, this method will attempt to connect to that
   * external server. Otherwise, it spawns a local server process using the provided `host` and `port`.
   *
   * @returns A promise that resolves with the readiness of the server.
   * @throws Error If the server cannot be reached.
   */
  public async start(): Promise<void> {
    if (this.status === 'started') {
      Logger.warn(`Server is already started.`);
      return;
    }

    if (this.status === 'starting' && this.startPromise) {
      Logger.warn('Server is already starting.');
      return this.startPromise;
    }

    this.status = 'starting';

    this.startPromise = (async () => {
      try {
        if (this.config.isRemote) {
          Logger.info(`Connecting to external server at ${this.config.url}`);
        } else {
          await validateServer();

          Logger.info(`Starting local server at ${this.config.url}...`);

          this.process = spawn(SERVER_CONFIG.path, {
            stdio: ['pipe', this.config.stdio, this.config.stdio],
            env: {
              ...process.env,
              DISCORD_HTML_TRANSCRIPT_HOST: this.config.host,
              DISCORD_HTML_TRANSCRIPT_PORT: String(this.config.port),
            },
          });

          process.once('exit', this.handleExit);
        }

        await this.checkReady();
        this.status = 'started';
        Logger.info(`Server ready at ${this.config.url}`);
      } catch (error) {
        this.stop();
        throw error;
      } finally {
        this.startPromise = null;
      }
    })();

    return this.startPromise;
  }

  /** Stops the local server. */
  public stop(): void {
    if (this.process) {
      Logger.info('Stopping server...');
      this.process.kill();
      this.process = null;
      process.off('exit', this.handleExit);
    }

    this.status = 'stopped';
  }

  /**
   * @returns A promise that resolves when the server is ready to accept requests.
   * @throws ServerError If the server was not started.
   */
  public async awaitReady(): Promise<void> {
    if (this.status === 'started') {
      return;
    }

    if (this.status === 'starting' && this.startPromise) {
      return this.startPromise;
    }

    throw new ServerError('Server is stopped. Did you forget to call "start()"?');
  }

  /**
   * Polls the server's `GET /health` endpoint to verify its readiness.
   *
   * @param maxAttempts The maximum number of connection attempts before failing.
   * @param attemptIntervalMs The interval between each connection attempt in milliseconds.
   * @throws Error
   */
  private async checkReady(maxAttempts = 20, attemptIntervalMs = 500): Promise<void> {
    for (let attempts = 1; attempts <= maxAttempts; attempts++) {
      try {
        await this.fetcher.fetchHealth();
        return;
      } catch (error) {
        if (error instanceof ServerError || attempts === maxAttempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, attemptIntervalMs));
      }
    }
  }
}
