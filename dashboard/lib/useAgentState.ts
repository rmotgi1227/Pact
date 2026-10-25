'use client';
// Goal R2 (Phase G). The dashboard never imports the agent's bus: it is a pure HTTP
// client of the agent on :4000 (/state, /stream, /actions/<name>, /events for demo.replay only).
import { useEffect, useState, useCallback } from 'react';
import type { StateSnapshot } from '@pact/core';

export const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? 'http://localhost:4000';

export function useAgentState() {
  const [state, setState] = useState<StateSnapshot | null>(null);

  const refetch = useCallback(() => {
    fetch(`${AGENT_URL}/state`)
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState(null));
  }, []);

  useEffect(() => {
    refetch();
    const es = new EventSource(`${AGENT_URL}/stream`);
    es.onmessage = () => refetch(); // any event -> refetch /state; simplest correct option for a single-box demo
    es.onerror = () => setState((prev) => prev); // keep last good state; refetch() above already guards agent-down
    return () => es.close();
  }, [refetch]);

  return state;
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
