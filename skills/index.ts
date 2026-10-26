import type { SkillDef } from '@pact/core';
import { handler as captureCommitments, onClosedWon as captureOnClosedWon } from './capture-commitments/handler.js';
import { handler as classifyRequest, onCrApproved } from './classify-request/handler.js';
import { handler as consolidateCommitments } from './consolidate-commitments/handler.js';
import { handler as draftSow } from './draft-sow/handler.js';
import { handler as generateAcceptanceTests } from './generate-acceptance-tests/handler.js';
import { handler as generatePrototype } from './generate-prototype/handler.js';
import { handler as githubSync } from './github-sync/handler.js';
import { handler as runAcceptanceTests } from './run-acceptance-tests/handler.js';
import { handler as mapPrToSow } from './map-pr-to-sow/handler.js';
import { handler as triageTicket } from './triage-ticket/handler.js';
import { handler as draftChangeOrder } from './draft-change-order/handler.js';
import { handler as buildFeatures } from './build-features/handler.js';
import { handler as requestCrApproval } from './request-cr-approval/handler.js';
import { demoReplay } from './demo-replay.js';
import { onBuildRequested } from '../builder/build.js'; // ({buildId}, ctx) => builder.enqueue(buildId, ctx)
import { onBuildPassed, onShareRequested } from '../builder/deploy.js';

export const skills: SkillDef[] = [
  { name: 'capture-commitments', on: 'transcript.added', handler: captureCommitments },
  { name: 'classify-request', on: 'transcript.added', handler: classifyRequest },
  { name: 'capture-commitments', on: 'deal.closed_won', handler: captureOnClosedWon },        // read every sales call when the deal closes
  { name: 'consolidate-commitments', on: 'deal.closed_won', handler: consolidateCommitments }, // waits for those reads
  { name: 'draft-sow', on: 'commitments.consolidated', handler: draftSow },
  { name: 'generate-acceptance-tests', on: 'sow.approved', handler: generateAcceptanceTests },
  { name: 'generate-prototype', on: 'sow.approved', handler: generatePrototype },
  { name: 'github-sync', on: 'tests.generated', handler: githubSync },
  { name: 'build', on: 'build.requested', handler: onBuildRequested },
  { name: 'run-acceptance-tests', on: 'build.ready', handler: runAcceptanceTests },
  { name: 'map-pr-to-sow', on: 'build.passed', handler: mapPrToSow }, // payload {buildId}; skips non-pr builds
  { name: 'map-pr-to-sow', on: 'build.failed', handler: mapPrToSow },
  { name: 'build-features', on: 'build.failed', handler: buildFeatures },               // prototype: Qwen3-Coder builds what still fails
  { name: 'deploy', on: 'build.passed', handler: onBuildPassed },      // prototypes only
  { name: 'deploy-share', on: 'share.requested', handler: onShareRequested },
  { name: 'apply-change-request', on: 'cr.approved', handler: onCrApproved },
  { name: 'triage-ticket', on: 'ticket.created', handler: triageTicket },
  { name: 'draft-change-order', on: 'cr.approved', handler: draftChangeOrder },          // Qwen drafts, then emailed to the customer
  { name: 'request-cr-approval', on: 'cr.drafted', handler: requestCrApproval },        // scope creep -> approve/deny email to the operator
  { name: 'demo-replay', on: 'demo.replay', handler: demoReplay }, // stage fallback: re-publishes a recorded real run
];
