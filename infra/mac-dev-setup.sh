#!/usr/bin/env bash
# Laptop setup for PACT_MODEL_PROFILE=mac-dev. Ollama as the prebuilt app (the formula compiles from source);
# Docker via Colima (lightweight, no sudo) instead of Docker Desktop.
set -euo pipefail
brew list --cask ollama-app >/dev/null 2>&1 || brew install --cask ollama-app
brew install colima docker docker-buildx
mkdir -p ~/.docker/cli-plugins && ln -sfn "$(brew --prefix)/opt/docker-buildx/bin/docker-buildx" ~/.docker/cli-plugins/docker-buildx
colima status >/dev/null 2>&1 || colima start --cpu 4 --memory 8 --disk 60
open -a Ollama
until curl -sf http://127.0.0.1:11434/api/version >/dev/null; do sleep 1; done
ollama pull qwen3.5:9b
ollama pull bge-m3
# Tev1 decision model, 4-bit, from local weights. Named as core's profile expects.
ollama pull hf.co/bartowski/togethercomputer_Tev1-4B-experimental-GGUF:Q4_K_M
ollama cp hf.co/bartowski/togethercomputer_Tev1-4B-experimental-GGUF:Q4_K_M togethercomputer/Tev1-4B-experimental
corepack enable && pnpm install
echo "export PACT_MODEL_PROFILE=mac-dev   # then: bash infra/gb10/smoke.sh"
