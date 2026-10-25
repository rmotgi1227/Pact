'use client';
// Goal R2 (Phase G). The dashboard never imports the agent's bus: it is a pure HTTP
// client of the agent on :4000 (/state, /stream, /actions/<name>, /events for demo.replay only).
import { useSyncExternalStore } from 'react';
import type { StateSnapshot } from '@pact/core';

export const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? 'http://localhost:4000';

// Every screen composes many small panels, and each used to call useAgentState()
// independently — one fetch + one EventSource per panel. The console page alone has a
// dozen of them, which blew past the browser's per-origin HTTP/1.1 connection cap (6):
// EventSource connections are long-lived, so late panels' /state fetches queued forever
// and silently rendered stale data. One shared poller + one shared EventSource for the
// whole app fixes that and halves the render fan-out on every /stream message.
let state: StateSnapshot | null = null;
let started = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function refetch() {
  fetch(`${AGENT_URL}/state`)
    .then((r) => r.json())
    .then((next: StateSnapshot) => {
      state = next;
      notify();
    })
    .catch(() => {
      state = null;
      notify();
    });
}

function start() {
  if (started) return;
  started = true;
  refetch();
  const es = new EventSource(`${AGENT_URL}/stream`);
  es.onmessage = () => refetch(); // any event -> refetch /state; simplest correct option for a single-box demo
  // keep last good state on a transient stream error; refetch() above already guards agent-down
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return null;
}

export function useAgentState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function postAction(name: string, payload: object = {}) {
  return fetch(`${AGENT_URL}/actions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// /events is for demo.replay only — every other control goes through postAction.
export function postEvent(topic: string, payload: object = {}) {
  return fetch(`${AGENT_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, payload }),
  });
}
