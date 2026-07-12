#!/bin/bash
# Add or update XAI_API_KEY on the Hetzner app host without wiping other env vars.
# Usage (on server):
#   XAI_API_KEY=xai-... bash scripts/set-xai-key.sh
# Or:
#   bash scripts/set-xai-key.sh xai-your-key-here
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bina}"
ENV_FILE="${APP_DIR}/.env"
KEY="${1:-${XAI_API_KEY:-}}"

if [ -z "$KEY" ]; then
  echo "ERROR: pass the key as arg or set XAI_API_KEY env var"
  echo "  bash scripts/set-xai-key.sh xai-..."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

# Remove old XAI lines, then append
grep -vE '^(XAI_API_KEY|XAI_MODEL|XAI_MODEL_ARTICLE|XAI_MODEL_FAST)=' "$ENV_FILE" > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"
{
  echo "XAI_API_KEY=${KEY}"
  echo "XAI_MODEL_ARTICLE=${XAI_MODEL_ARTICLE:-grok-3}"
  echo "XAI_MODEL_FAST=${XAI_MODEL_FAST:-grok-3-mini}"
} >> "$ENV_FILE"

echo "=== Wrote XAI_* to ${ENV_FILE} ==="
cd "$APP_DIR"
# Recreate app so runtime env is picked up (no full rebuild needed for server-only secrets)
docker compose up -d --force-recreate app
echo "=== Waiting for app ==="
sleep 4
docker compose ps app
echo "=== XAI_API_KEY present in container? ==="
if docker compose exec -T app sh -c 'test -n "$XAI_API_KEY" && echo YES || echo NO'; then
  :
fi
echo "Done."
