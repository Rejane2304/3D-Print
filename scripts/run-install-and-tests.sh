#!/usr/bin/env bash
set -euo pipefail

HOST_FILE="/etc/hosts"
ENTRIES=(
  "104.16.6.34 registry.npmjs.org"
  "104.16.2.34 registry.npmjs.org"
)

for entry in "${ENTRIES[@]}"; do
  if ! grep -qF "$entry" "$HOST_FILE"; then
    echo "  • Adding $entry"
    echo "$entry" | sudo tee -a "$HOST_FILE" >/dev/null
  else
    echo "  • Entry already exists: $entry"
  fi
done

export NVM_AUTO_USE=false
NODE_BIN="$HOME/.nvm/versions/node/v18.20.8/bin"
if [ -d "$NODE_BIN" ]; then
  export PATH="$NODE_BIN:$PATH"
fi
echo "=> Using Node $(node -v || echo 'node not found')"

echo "=> Removing existing node_modules"
rm -rf node_modules

if [ -n "${HTTP_PROXY:-}" ]; then
  echo "=> Using HTTP_PROXY=$HTTP_PROXY"
fi
if [ -n "${HTTPS_PROXY:-}" ]; then
  echo "=> Using HTTPS_PROXY=$HTTPS_PROXY"
fi

echo "=> Running yarn install (registry forced to npmjs)"
YARN_REGISTRY="https://registry.npmjs.org" yarn install

echo "=> Running yarn vitest"
yarn vitest

echo "=> Running Playwright suite"
npx playwright test

echo "=> Setup + tests completed successfully."
