// Each skills/<name>/ folder has a SKILL.md (name, description, input = the event payload).
// On startup we register every skill with the local OpenClaw agent, which runs inside OpenShell
// via NemoClaw with Qwen3.6-35B-A3B as its model. When an event fires, wireSkills hands it to OpenClaw
// (OPENCLAW_URL set) or calls the handler directly (fallback, same code path).
import { skills } from '../skills/index.js';
export async function registerWithOpenClaw() {
  if (!process.env.OPENCLAW_URL) return; // fallback: direct dispatch
  for (const s of skills) {
    await fetch(`${process.env.OPENCLAW_URL}/skills`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: s.name, skillDir: `skills/${s.name}`, trigger: s.on }) }); // UNVERIFIED shape
  }
}
