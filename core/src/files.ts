import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// pact/specs/, any cwd. PACT_SPECS_DIR moves it when the repo is mounted read-only (the NemoClaw sandbox).
const root = process.env.PACT_SPECS_DIR ?? fileURLToPath(new URL('../../specs/', import.meta.url));
export const files = {
  specsDir: (dealId: string) => join(root, dealId),
  async writeSpec(dealId: string, testId: string, src: string) {
    await mkdir(files.specsDir(dealId), { recursive: true });
    const path = join(files.specsDir(dealId), `${testId}.spec.ts`);
    await writeFile(path, src, 'utf8');
    return path;
  },
  readSpec: (dealId: string, testId: string) => readFile(join(files.specsDir(dealId), `${testId}.spec.ts`), 'utf8'),
};
export type Files = typeof files;
