import { readFile } from 'node:fs/promises';
import { store } from './store.js';
import { bus } from './bus.js';
import { makeLlm, type Llm } from './llm.js';
import { makeDecide, type Decide } from './decide.js';
import { files, type Files } from './files.js';
import type { SkillLog, Topic } from './types.js';
import type { github } from '../../github/client.js';
import type { builder } from '../../builder/index.js';

export type Log = Record<SkillLog['level'], (msg: string, extra?: unknown) => void>;
export type Ctx = { store: typeof store; bus: typeof bus; llm: Llm; decide: Decide; github: typeof github;
  builder: typeof builder; files: Files; readPrompt: (skill: string) => Promise<string>; log: Log };
export type Skill<In, Out> = (input: In, ctx: Ctx) => Promise<Out>;
export type SkillDef = { name: string; on: Topic; handler: Skill<any, unknown> };

let deps: Pick<Ctx, 'github' | 'builder'> | undefined;
export const inject = (d: Pick<Ctx, 'github' | 'builder'>) => { deps = d; };

// prompts/<skill>/system.md, resolved from core/src so it works under tsx with any cwd
export const readPrompt = (skill: string) =>
  readFile(new URL(`../../prompts/${skill}/system.md`, import.meta.url), 'utf8');

const makeLog = (skill: string): Log => {
  const at = (level: SkillLog['level']) => (msg: string, extra?: unknown) => {
    console[level](`[${skill}] ${msg}`, extra ?? '');
    const e: SkillLog = { skill, level, msg, at: Date.now(), extra: extra instanceof Error ? extra.message : extra };
    void bus.publish('skill.log', e);
  };
  return { info: at('info'), warn: at('warn'), error: at('error') };
};

export function makeCtx(skill: string): Ctx {
  if (!deps) throw new Error('call inject({ github, builder }) first');
  return { store, bus, llm: makeLlm(skill), decide: makeDecide(skill), ...deps, files, readPrompt, log: makeLog(skill) };
}

export async function runSkill(s: SkillDef, input: unknown) {
  const ctx = makeCtx(s.name);
  ctx.log.info(`started on ${s.on}`);
  try { const out = await s.handler(input, ctx); ctx.log.info('done'); return out; }
  catch (err) { ctx.log.error('failed', err); throw err; } // bus releases the claim so a republish retries
}

export function wireSkills(skills: SkillDef[]) {
  for (const s of skills) bus.subscribe(s.name, s.on, (input) => runSkill(s, input));
}
