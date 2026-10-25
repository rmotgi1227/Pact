import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEMPLATE_DIR = path.resolve(import.meta.dirname, '../../templates/booking-proto');
const SLOTS = {
  title: 'Find your car', tagline: 'Search, book, confirm.',
  searchFields: [{ key: 'location', label: 'Pickup location', type: 'text' as const }],
  showTabletLayout: false,
  screens: {
    results: { heading: 'Available cars' },
    book: { heading: 'Book this car', cta: 'Reserve' },
    confirm: { heading: 'Booked', message: 'Confirmation on its way.' },
  },
};

const builds: string[] = [];
afterEach(async () => { await Promise.all(builds.map((d) => fs.rm(d, { recursive: true, force: true }))); builds.length = 0; });

describe('fillTemplate', () => {
  it('writes slots.json into /tmp/pact-builds/<buildId>/src and leaves app files untouched', async () => {
    const { fillTemplate } = await import('../fill-template.js');
    const buildId = `build_test_${Date.now()}`;
    const srcDir = await fillTemplate(buildId, SLOTS);
    builds.push(path.dirname(srcDir));

    expect(srcDir).toBe(`/tmp/pact-builds/${buildId}/src`);

    const written = JSON.parse(await fs.readFile(path.join(srcDir, 'slots.json'), 'utf8'));
    expect(written).toEqual(SLOTS);

    const original = await fs.readFile(path.join(TEMPLATE_DIR, 'app', 'page.tsx'), 'utf8');
    const copied = await fs.readFile(path.join(srcDir, 'app', 'page.tsx'), 'utf8');
    expect(copied).toBe(original);

    const originalPackageJson = await fs.readFile(path.join(TEMPLATE_DIR, 'package.json'), 'utf8');
    const copiedPackageJson = await fs.readFile(path.join(srcDir, 'package.json'), 'utf8');
    expect(copiedPackageJson).toBe(originalPackageJson);
  });

  it('does not copy node_modules or .next into the build', async () => {
    const { fillTemplate } = await import('../fill-template.js');
    const buildId = `build_test_${Date.now()}_2`;
    const srcDir = await fillTemplate(buildId, SLOTS);
    builds.push(path.dirname(srcDir));

    await expect(fs.stat(path.join(srcDir, 'node_modules'))).rejects.toThrow();
  });
});
