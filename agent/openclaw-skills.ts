// The plan's 9 skills go through OpenClaw. Plumbing (build, deploy, CR apply, replay) runs directly.
// Its own module so infra/sandbox/install-skills.ts can read it without opening the agent's database.
export const OPENCLAW_SKILLS = new Set(['capture-commitments', 'consolidate-commitments', 'draft-sow', 'classify-request',
  'triage-ticket', 'generate-acceptance-tests', 'generate-prototype', 'map-pr-to-sow', 'run-acceptance-tests',
  'draft-change-order', 'build-features']);
