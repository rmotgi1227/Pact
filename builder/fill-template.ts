// Copies the booking-proto template into a build's srcDir and writes the model-filled slots.
// This is the only thing that touches template files at build time: it writes exactly one JSON
// file (slots.json) and never app code, so a model that tries to write markup anyway can't.
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Slots } from '../templates/booking-proto/slots.schema.js';

const TEMPLATE_DIR = path.resolve(import.meta.dirname, '../templates/booking-proto');

export async function fillTemplate(buildId: string, slots: Slots): Promise<string> {
  const srcDir = `/tmp/pact-builds/${buildId}/src`;
  await fs.cp(TEMPLATE_DIR, srcDir, {
    recursive: true,
    filter: (src) => !/[/\\](node_modules|\.next)([/\\]|$)/.test(src),
  });
  await fs.writeFile(path.join(srcDir, 'slots.json'), JSON.stringify(slots, null, 2));
  return srcDir;
}
