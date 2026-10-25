import { db } from './store.js';
const insert = db.prepare('INSERT INTO llm_calls VALUES (?,?,?,?,?,?)');
// A call that ran against a local model.
export const recordLocal = (skill: string, model: string, host: string) =>
  void insert.run(Date.now(), skill, model, host, 'local', 'ok');
// A cloud request that was stopped (by our host check or by the OpenShell firewall).
export const recordBlocked = (host: string, skill = 'cloud-probe', model = '-') =>
  void insert.run(Date.now(), skill, model, host, 'cloud', 'blocked');
// A cloud request that got through. Only the probe can cause this, and it means the sandbox is leaking.
export const recordCloud = (host: string, skill = 'cloud-probe', model = '-') =>
  void insert.run(Date.now(), skill, model, host, 'cloud', 'ok');
export const counter = () => db.prepare(`SELECT
  COUNT(*) FILTER (WHERE locality='local') AS local,
  COUNT(*) FILTER (WHERE locality='cloud' AND outcome!='blocked') AS cloud,
  COUNT(*) FILTER (WHERE outcome='blocked') AS blocked FROM llm_calls`).get() as
  { local: number; cloud: number; blocked: number };
