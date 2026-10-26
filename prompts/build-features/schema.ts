import { z } from 'zod';
// Qwen3-Coder's change to the prototype for the SOW lines that still fail. Code validates every path
// (app/ lib/ theme/ data/ only, .ts/.tsx), applies it to a copy of the source, and the tests decide.
const SRC_PATH = /^(app|lib|theme|data)\/(?!.*\.\.)[\w\-./[\]()]+\.(ts|tsx)$/;
export const BuildFeaturesOutput = z.object({
  summary: z.string().min(1).max(600),           // what was built, for the log and the repo's commit message
  files: z.array(z.object({
    path: z.string().regex(SRC_PATH, 'only .ts/.tsx under app/, lib/, theme/ or data/'),
    content: z.string().min(1).max(40_000),       // the whole file
  })).max(12),
  css: z.string().max(12_000).default(''),        // appended to app/globals.css
});
export type BuildFeaturesOutput = z.infer<typeof BuildFeaturesOutput>;
