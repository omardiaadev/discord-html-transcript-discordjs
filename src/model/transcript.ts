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

import { AttachmentBuilder } from 'discord.js';
import { writeFile } from 'node:fs/promises';

/** Represents the generated HTML file as a byte output, provides utility functions. */
export default class Transcript {
  private readonly output;

  constructor(output: Uint8Array<ArrayBuffer>) {
    this.output = output;
  }

  /**
   * Writes {@linkcode output} into a file with the provided {@linkcode path}.
   *
   * @param path The file path to write into.
   * @see fs.writeFile
   */
  public async toFile(path: string): Promise<void> {
    await writeFile(path, this.output);
  }

  /**
   * Writes {@linkcode output} into discord.js's {@linkcode AttachmentBuilder}.
   *
   * @param filename The name to use for constructing the {@linkcode AttachmentBuilder}.\
   *   If {@linkcode filename} does not end with `.html`, it will be appended automatically.
   * @returns {@linkcode AttachmentBuilder} To use directly in discord.js interactions.
   */
  public toAttachmentBuilder(filename: string = 'transcript.html'): AttachmentBuilder {
    filename = !filename.endsWith('.html') ? filename.concat('.html') : filename;
    return new AttachmentBuilder(Buffer.from(this.output), { name: filename });
  }
}
