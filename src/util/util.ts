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

import { accessSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import constants from 'node:constants';

/** @see getPackageRootDir */
export const PACKAGE_ROOT_DIR = getPackageRootDir();

/**
 * Dynamically resolves the root of the package by looking for package.json.\
 * This guarantees path safety between `/src` and `/dist` environments.
 */
function getPackageRootDir(): string {
  let currentDir = import.meta.dirname;

  while (true) {
    const packageJsonPath = `${currentDir}/package.json`;
    try {
      accessSync(packageJsonPath, constants.F_OK);
      // Check if it's a real package root (contains a "name" field)
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      if (packageJson.name) {
        return currentDir;
      }
    } catch (e) {
      // File not found or other access error, continue to parent directory
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error('Package root not found.');
    }

    currentDir = parentDir;
  }
}
