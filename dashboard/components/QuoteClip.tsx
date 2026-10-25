'use client';
import type { Quote } from '@pact/core';

export function QuoteClip({ q }: { q: Quote }) {
  const src = `/audio/${q.transcriptId}.mp3#t=${q.t}`;
  const mm = Math.floor(q.t / 60);
  const ss = String(q.t % 60).padStart(2, '0');

  return (
    <figure className="quote-clip">
      <blockquote>
        &ldquo;{q.text}&rdquo;{' '}
        <small className="muted mono">
          {q.transcriptId} · {mm}:{ss}
        </small>
      </blockquote>
      <audio
        controls
        preload="none"
        src={src}
        onError={(e) => {
          (e.target as HTMLAudioElement).style.display = 'none';
        }}
      />
    </figure>
  );
}
