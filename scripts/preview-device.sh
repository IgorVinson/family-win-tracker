#!/usr/bin/env bash
# Start Expo Metro bound to this machine's Tailscale IPv4 so a phone on the
# same tailnet can open the PR branch in Expo Go.
# Run on your PC. Cloud Agents do not host this for your phone.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

TUNNEL=0
EXTRA_ARGS=()
for arg in "$@"; do
  case "${arg}" in
    --tunnel) TUNNEL=1 ;;
    -h|--help)
      sed -n '2,5p' "$0"
      echo "Usage: ./scripts/preview-device.sh [--tunnel] [-- expo-args...]"
      echo "Env: EXPO_APP_DIR, TAILSCALE_IP"
      exit 0
      ;;
    --) shift; EXTRA_ARGS+=("$@"); break ;;
    *) EXTRA_ARGS+=("${arg}") ;;
  esac
done

find_expo_dir() {
  if [[ -n "${EXPO_APP_DIR:-}" ]]; then
    printf '%s\n' "${EXPO_APP_DIR}"
    return
  fi
  local candidate
  for candidate in . apps/mobile app mobile packages/app apps/kids-rise; do
    if [[ -f "${candidate}/package.json" ]] && grep -q '"expo"' "${candidate}/package.json"; then
      printf '%s\n' "${candidate}"
      return
    fi
  done
  return 1
}

if ! APP_DIR="$(find_expo_dir)"; then
  cat <<'EOF' >&2
No Expo app found in this checkout yet.

KidsRise has not been scaffolded. When a phase adds the Expo app, re-run this
script from the repo root (or set EXPO_APP_DIR).

Until then:
  - Review screenshots / recordings on the pull request, or
  - For the legacy Vite web app only: npm install && npm run dev
EOF
  exit 1
fi

if [[ ! -d "${APP_DIR}/node_modules" ]]; then
  echo "Installing dependencies in ${APP_DIR}..."
  (cd "${APP_DIR}" && npm install)
fi

if [[ "${TUNNEL}" -eq 1 ]]; then
  echo "Starting Expo with --tunnel (no Tailscale bind)."
  cd "${APP_DIR}"
  exec npx expo start --tunnel "${EXTRA_ARGS[@]}"
fi

if [[ -z "${TAILSCALE_IP:-}" ]]; then
  if ! command -v tailscale >/dev/null 2>&1; then
    echo "tailscale CLI not found on PATH. Install Tailscale or pass --tunnel." >&2
    exit 1
  fi
  TAILSCALE_IP="$(tailscale ip -4 2>/dev/null | head -n 1 | tr -d '[:space:]' || true)"
fi

if [[ -z "${TAILSCALE_IP}" ]]; then
  echo "Could not read a Tailscale IPv4 address. Is Tailscale logged in? Or use --tunnel." >&2
  exit 1
fi

export REACT_NATIVE_PACKAGER_HOSTNAME="${TAILSCALE_IP}"
echo "Expo app:  ${APP_DIR}"
echo "Tailscale: ${TAILSCALE_IP}"
echo "On your phone (Tailscale on), open Expo Go and scan the QR code,"
echo "or connect to exp://${TAILSCALE_IP}:8081"
echo

cd "${APP_DIR}"
exec npx expo start --lan "${EXTRA_ARGS[@]}"
