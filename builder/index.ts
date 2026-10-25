// goal S4 (Shreyas). The one surface the agent and skills talk to: nothing else calls docker directly.
import { enqueue, buildAndTest, testRef, teardown } from './build.js';
import { runTests } from './runner/run-tests.js';

export const builder = { enqueue, buildAndTest, testRef, runTests, teardown };
