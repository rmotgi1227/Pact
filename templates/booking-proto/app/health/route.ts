// No slot/model dependency — must respond before (and regardless of) the LLM fill step.
export function GET() {
  return new Response('ok', { status: 200 });
}
