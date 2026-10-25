import type { SkillDef } from '@pact/core';
import { handler as captureCommitments } from './capture-commitments/handler.js';
import { handler as classifyRequest, onCrApproved } from './classify-request/handler.js';
import { handler as consolidateCommitments } from './consolidate-commitments/handler.js';
import { handler as draftSow } from './draft-sow/handler.js';
import { handler as generateAcceptanceTests } from './generate-acceptance-tests/handler.js';
import { handler as generatePrototype } from './generate-prototype/handler.js';
import { handler as githubSync } from './github-sync/handler.js';
import { handler as runAcceptanceTests } from './run-acceptance-tests/handler.js';
import { handler as mapPrToSow } from './map-pr-to-sow/handler.js';
import { handler as triageTicket } from './triage-ticket/handler.js';
import { demoReplay } from './demo-replay.js';
import { onBuildRequested } from '../builder/build.js'; // ({buildId}, ctx) => builder.enqueue(buildId, ctx)
import { onBuildPassed, onShareRequested } from '../builder/deploy.js';

export const skills: SkillDef[] = [
  { name: 'capture-commitments', on: 'transcript.added', handler: captureCommitments },
  { name: 'classify-request', on: 'transcript.added', handler: classifyRequest },
  { name: 'consolidate-commitments', on: 'deal.closed_won', handler: consolidateCommitments },
  { name: 'draft-sow', on: 'commitments.consolidated', handler: draftSow },
  { name: 'generate-acceptance-tests', on: 'sow.approved', handler: generateAcceptanceTests },
  { name: 'generate-prototype', on: 'sow.approved', handler: generatePrototype },
  { name: 'github-sync', on: 'tests.generated', handler: githubSync },
  { name: 'build', on: 'build.requested', handler: onBuildRequested },
  { name: 'run-acceptance-tests', on: 'build.ready', handler: runAcceptanceTests },
  { name: 'map-pr-to-sow', on: 'build.passed', handler: mapPrToSow }, // payload {buildId}; skips non-pr builds
  { name: 'map-pr-to-sow', on: 'build.failed', handler: mapPrToSow },
  { name: 'deploy', on: 'build.passed', handler: onBuildPassed },      // prototypes only
  { name: 'deploy-share', on: 'share.requested', handler: onShareRequested },
  { name: 'apply-change-request', on: 'cr.approved', handler: onCrApproved },
  { name: 'triage-ticket', on: 'ticket.created', handler: triageTicket },
  { name: 'demo-replay', on: 'demo.replay', handler: demoReplay }, // stage fallback: re-publishes a recorded real run
];
