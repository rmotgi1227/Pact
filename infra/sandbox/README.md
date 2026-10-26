# infra/sandbox/ (GB10: agent inside NemoClaw, skills through OpenClaw)

How Pact runs on the GB10 as build-plan.md draws it:

- **Agent** (`agent/main.ts`) runs inside the NemoClaw sandbox `my-assistant`. OpenShell decides its egress: local models via NemoClaw's Ollama auth proxy (`host.openshell.internal:11435`), the host build service (`:4100`), `api.github.com`. Anything else, including `api.openai.com`, is denied and counted (S2).
- **OpenClaw** (Qwen3.6-35B-A3B on local Ollama) gets one turn per event and starts the matching `pact-*` skills over a Unix socket (`/sandbox/pact-data/openclaw.sock`; OpenShell blocks loopback TCP). A skill OpenClaw doesn't start runs directly, with a warning in the log. See `agent/openclaw.ts`.
- **Builds** (Docker, the booking repo clone, Vercel) run on the host in `builder/host.ts`, which the sandboxed agent calls with a token. Without `PACT_BUILDER_URL` the agent does them itself (laptops).

## One-time: onboard the sandbox
```sh
NEMOCLAW_PROVIDER=ollama NEMOCLAW_MODEL=qwen3.6:35b-a3b NEMOCLAW_SANDBOX_NAME=my-assistant \
NEMOCLAW_POLICY_MODE=custom NEMOCLAW_POLICY_PRESETS=local-inference \
nemoclaw onboard --non-interactive --yes --fresh --name my-assistant \
  --host-mount "$PWD:/sandbox/pact" --yes-i-accept-third-party-software
```
The repo is mounted read-only; the agent's database and specs live in `/sandbox/pact-data`. If a sandbox already exists, `nemoclaw my-assistant destroy` first: recreating over an existing one fails while restoring its workspace backup onto the mount.

## Every run
```sh
pnpm sandbox        # = bash infra/sandbox/up.sh: policy, skills, host builder, agent, :4000 forward
pnpm dashboard      # on the host, :3000
PACT_SANDBOX=my-assistant pnpm verify s3   # verify scripts read the agent's files through the sandbox
```
Logs: `~/.pact/builder.log` (host), `nemoclaw my-assistant exec -- tail -f /sandbox/pact-data/agent.log` (agent).

## Gotchas found on the box
- A `nemoclaw rebuild` can leave OpenClaw pointed at a vLLM endpoint on `:8000` that isn't running; every turn then fails with "network connection error". Re-onboard as above.
- NemoClaw's baseline policy allows hosted AI (`nvidia`, `clawhub`, `openclaw_api`); `up.sh` excludes them.
- `nemoclaw policy add --from-file` rejects private hosts; `up.sh` uses `openshell policy update` instead.
- Each OpenClaw turn takes ~15–60 s on top of the skill itself.
