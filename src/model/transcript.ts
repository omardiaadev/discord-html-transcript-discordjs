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

import { AttachmentBuilder, type AttachmentData } from 'discord.js';
import { writeFile } from 'node:fs/promises';

/** Represents the transcript. */
export class Transcript {
  private readonly output;

  /** @param output The transcript output in bytes. */
  constructor(output: Uint8Array<ArrayBuffer>) {
    this.output = output;
  }

  /**
   * Writes {@linkcode output} into a file with the provided {@linkcode path}.
   *
   * @param path The destination file path.
   */
  public async toFile(path: string): Promise<void> {
    await writeFile(path, this.output);
  }

  /**
   * Writes {@linkcode output} into a discord.js {@linkcode AttachmentBuilder}.
   *
   * If the provided {@linkcode name} does not end with `.html`, it will be appended automatically.
   *
   * @param name The filename to use for the {@linkcode AttachmentBuilder}.
   * @param data The data to use for the {@linkcode AttachmentBuilder}.
   * @returns {@linkcode AttachmentBuilder} To use directly in discord.js interactions.
   */
  public toAttachmentBuilder({ name = 'transcript.html', ...data }: AttachmentData = {}): AttachmentBuilder {
    const filename = name.toLowerCase().endsWith('.html') ? name : `${name}.html`;
    const buffer = Buffer.from(this.output.buffer, this.output.byteOffset, this.output.byteLength);
    return new AttachmentBuilder(buffer, { ...data, name: filename });
  }
}
