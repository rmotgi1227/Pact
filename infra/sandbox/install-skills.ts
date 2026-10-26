// Installs Pact's 9 skills into the NemoClaw sandbox as OpenClaw skills (`pact-<name>`). Run on the host:
//   pnpm tsx infra/sandbox/install-skills.ts [sandbox]
// Each SKILL.md tells OpenClaw the skill's trigger and how to start it: POST /openclaw/run on the Pact agent's Unix socket,
// which runs the real handler (agent/openclaw.ts). Triggers come from skills/index.ts, so they can't drift.
import { execa } from 'execa';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OPENCLAW_SKILLS } from '../../agent/openclaw-skills.js';

const sandbox = process.argv[2] ?? 'my-assistant';
const what: Record<string, string> = {
  'capture-commitments': 'Pulls every customer commitment, with its exact quote, out of a sales call transcript.',
  'classify-request': 'Checks a status-call request against the approved SOW and drafts a change request for new scope.',
  'consolidate-commitments': 'Merges duplicate commitments across all sales calls once the deal is Closed Won.',
  'draft-sow': 'Writes the SOW, one testable line per commitment, streaming each line as it is drafted.',
  'generate-acceptance-tests': 'Writes one Playwright acceptance test per SOW line.',
  'generate-prototype': 'Fills the booking prototype template from the approved SOW and requests a build.',
  'run-acceptance-tests': 'Runs the deal\'s acceptance tests against a build\'s fresh container.',
  'map-pr-to-sow': 'Maps a tested pull request to the SOW lines it satisfies and comments on the PR.',
  'triage-ticket': 'Matches a support ticket to its SOW line and runs that line\'s test to decide warranty or change request.',
  'draft-change-order': 'Drafts the change order for an approved change request and emails it to the customer.',
  'build-features': 'Writes the code for the promised features the prototype still fails, then rebuilds and retests it.',
};

// Read the registry as text: importing skills/index.ts would open the agent's database.
const index = await readFile(new URL('../../skills/index.ts', import.meta.url), 'utf8');
const triggers = new Map<string, string[]>();
for (const [, name, on] of index.matchAll(/\{ name: '([\w-]+)', on: '([\w.]+)'/g))
  if (OPENCLAW_SKILLS.has(name)) triggers.set(name, [...(triggers.get(name) ?? []), on]);

const stage = await mkdtemp(join(tmpdir(), 'pact-skills-'));
const install = async (id: string, md: string, what: string) => {
  await mkdir(join(stage, id), { recursive: true });
  await writeFile(join(stage, id, 'SKILL.md'), md);
  const { exitCode, all } = await execa('nemoclaw', [sandbox, 'skill', 'install', join(stage, id)], { reject: false, all: true });
  console.log(`${exitCode === 0 ? 'installed' : 'FAILED'} ${id} (${what})${exitCode === 0 ? '' : `\n${all}`}`);
  if (exitCode !== 0) process.exitCode = 1;
};

for (const [name, ons] of triggers) {
  const id = `pact-${name}`, list = ons.map((o) => `\`${o}\``).join(' or ');
  const md = `---
name: ${id}
description: "Pact skill. Trigger: ${ons.join(', ')}. ${what[name]}"
---
# ${id}

${what[name]}

**Trigger:** run this skill only for a Pact event whose topic is exactly ${list}.

**How to run it:** execute this one command, with EVENT_ID replaced by the event id you were given:

\`\`\`sh
curl -s --unix-socket /sandbox/pact-data/openclaw.sock -X POST http://pact/openclaw/run -H 'content-type: application/json' -d '{"skill":"${id}","eventId":"EVENT_ID"}'
\`\`\`

A reply with \`"ok":true\` means Pact started the skill; Pact runs it and records every result itself.
Run it once per event. Do not edit files or call models for this skill: the command is the whole job.
`;
  await install(id, md, ons.join(', '));
}
