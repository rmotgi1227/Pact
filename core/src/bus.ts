import { randomUUID } from 'node:crypto';
import { db } from './store.js';
import type { Topic } from './types.js';

export type BusEvent = { id: string; topic: Topic; payload: any };
type Handler = (payload: any) => Promise<unknown>;
const subs: { skill: string; topic: Topic; fn: Handler }[] = [];
const listeners = new Set<(e: BusEvent) => void>();
const save = db.prepare('INSERT OR IGNORE INTO events VALUES (?,?,?,?)');
const claim = db.prepare('INSERT OR IGNORE INTO handled VALUES (?,?)');
const release = db.prepare('DELETE FROM handled WHERE event_id=? AND skill=?');

export const bus = {
  subscribe(skill: string, topic: Topic, fn: Handler): void { subs.push({ skill, topic, fn }); },
  listen(fn: (e: BusEvent) => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
  publish(topic: Topic, payload: object, eventId: string = randomUUID()): Promise<void> {
    save.run(eventId, topic, JSON.stringify(payload), Date.now());
    for (const l of listeners) try { l({ id: eventId, topic, payload }); } catch { /* a dead SSE client */ }
    return Promise.all(subs.filter((s) => s.topic === topic).map(async (s) => {
      if (claim.run(eventId, s.skill).changes === 0) return; // already handled or running
      try { await s.fn(payload); }
      catch (err) { release.run(eventId, s.skill); console.error(`[${s.skill}] ${topic} failed`, err); }
    })).then(() => undefined);
  },
  emit(topic: Topic, payload: object, eventId?: string): Promise<void> { return bus.publish(topic, payload, eventId); },
};
